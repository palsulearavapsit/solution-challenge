import pytest

from src.matching import find_matches, haversine_km, score_match
from src.models import Need, Volunteer


def _need(**kwargs) -> Need:
    defaults = dict(
        id=1, area="Test Area", need_type="Medical Camp", urgency="High",
        lat=19.0760, lon=72.8777, description="", status="Open",
    )
    return Need(**{**defaults, **kwargs})


def _volunteer(**kwargs) -> Volunteer:
    defaults = dict(
        id=1, name="Test Vol", skill="Medical", location="Mumbai",
        lat=19.0760, lon=72.8777, phone="", email="", availability="Available",
    )
    return Volunteer(**{**defaults, **kwargs})


class TestHaversine:
    def test_same_point_is_zero(self):
        assert haversine_km(19.0, 72.0, 19.0, 72.0) == 0.0

    def test_known_distance(self):
        # Mumbai CST to Pune is ~117 km straight-line
        dist = haversine_km(18.9388, 72.8354, 18.5204, 73.8567)
        assert 110 < dist < 125

    def test_is_symmetric(self):
        d1 = haversine_km(19.0, 72.0, 20.0, 73.0)
        d2 = haversine_km(20.0, 73.0, 19.0, 72.0)
        assert abs(d1 - d2) < 0.001


class TestScoreMatch:
    def test_matching_skill_returns_positive(self):
        vol  = _volunteer(skill="Medical")
        need = _need(need_type="Medical Camp", urgency="High")
        assert score_match(vol, need) > 0

    def test_non_matching_skill_returns_zero(self):
        vol  = _volunteer(skill="Education")
        need = _need(need_type="Medical Camp")
        assert score_match(vol, need) == 0.0

    def test_critical_urgency_scores_higher_than_low(self):
        vol      = _volunteer()
        critical = _need(urgency="Critical")
        low      = _need(urgency="Low")
        assert score_match(vol, critical) > score_match(vol, low)

    def test_closer_volunteer_scores_higher(self):
        need  = _need(lat=19.0760, lon=72.8777)
        close = _volunteer(lat=19.0760, lon=72.8777)
        far   = _volunteer(lat=19.3000, lon=72.8777)
        assert score_match(close, need) > score_match(far, need)

    def test_beyond_max_distance_returns_zero(self):
        vol  = _volunteer(lat=0.0, lon=0.0)
        need = _need(lat=19.0760, lon=72.8777)
        assert score_match(vol, need, max_dist_km=50.0) == 0.0

    def test_score_between_zero_and_one(self):
        vol  = _volunteer()
        need = _need()
        s = score_match(vol, need)
        assert 0.0 <= s <= 1.0


class TestFindMatches:
    def test_returns_only_available_volunteers(self):
        vol_assigned  = _volunteer(id=1, availability="Assigned")
        vol_available = _volunteer(id=2, availability="Available")
        need          = _need(status="Open")
        matches = find_matches([vol_assigned, vol_available], [need])
        volunteer_ids = [v.id for _, v, _ in matches]
        assert 1 not in volunteer_ids

    def test_returns_only_open_needs(self):
        vol         = _volunteer()
        open_need   = _need(id=1, status="Open")
        closed_need = _need(id=2, status="Resolved")
        matches = find_matches([vol], [open_need, closed_need])
        need_ids = [n.id for _, _, n in matches]
        assert 2 not in need_ids

    def test_sorted_by_score_descending(self):
        vol      = _volunteer()
        critical = _need(id=1, urgency="Critical")
        low      = _need(id=2, urgency="Low")
        matches  = find_matches([vol], [critical, low])
        scores   = [s for s, _, _ in matches]
        assert scores == sorted(scores, reverse=True)

    def test_top_k_limits_results(self):
        vols  = [_volunteer(id=i) for i in range(1, 6)]
        need  = _need()
        matches = find_matches(vols, [need], top_k=3)
        assert len(matches) <= 3

    def test_empty_inputs_return_empty(self):
        assert find_matches([], [_need()]) == []
        assert find_matches([_volunteer()], []) == []
