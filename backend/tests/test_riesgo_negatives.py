"""Tests for hard negative sampling key generation.

Targets the pure key generator `_generate_negative_keys`, so no CHIRPS / I/O is
required and the invariants the plan cares about are checked deterministically.
"""
import random

from app.ml.riesgo_climatico_dataset import _generate_negative_keys


DEPTS = [8, 13, 47, 20, 44]  # arbitrary dept codes
MIN_Y, MAX_Y = 1990, 2024


def _months_between(a, b):
    (d1, y1, m1), (d2, y2, m2) = a, b
    return abs((y1 * 12 + m1) - (y2 * 12 + m2))


class TestNoLeakageNoDuplicates:
    def test_never_collides_with_positive(self):
        positives = [(8, 2010, 6), (13, 2015, 3)]
        pos_keys = set(positives)
        keys = _generate_negative_keys(
            positives, n=200, positive_keys=pos_keys,
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            rng=random.Random(1),
        )
        assert all(k not in pos_keys for k in keys)

    def test_no_duplicate_negatives(self):
        positives = [(8, 2010, 6)]
        keys = _generate_negative_keys(
            positives, n=300, positive_keys=set(positives),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            rng=random.Random(2),
        )
        assert len(keys) == len(set(keys))

    def test_respects_year_bounds(self):
        positives = [(8, 1991, 1)]  # near lower bound — perturbation could underflow
        keys = _generate_negative_keys(
            positives, n=200, positive_keys=set(positives),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            rng=random.Random(3),
        )
        assert all(MIN_Y <= y <= MAX_Y for _, y, _ in keys)
        assert all(1 <= m <= 12 for _, _, m in keys)


class TestHardNegatives:
    def test_hard_negatives_share_dept_with_a_positive(self):
        positives = [(8, 2010, 6)]
        # hard_frac=1.0 → every negative must be a perturbation of the one seed
        keys = _generate_negative_keys(
            positives, n=30, positive_keys=set(positives),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            hard_frac=1.0, time_window=24, rng=random.Random(4),
        )
        assert keys, "expected some hard negatives"
        assert all(dept == 8 for dept, _, _ in keys)

    def test_hard_negatives_within_time_window(self):
        # ±12 months around one positive gives 24 unique hard slots; request
        # fewer so the random-coverage fallback never kicks in.
        positives = [(8, 2010, 6)]
        window = 12
        keys = _generate_negative_keys(
            positives, n=20, positive_keys=set(positives),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            hard_frac=1.0, time_window=window, rng=random.Random(5),
        )
        assert len(keys) == 20
        for k in keys:
            assert _months_between(k, (8, 2010, 6)) <= window

    def test_mix_includes_random_coverage_when_frac_below_one(self):
        # With one seed in dept 8 and hard_frac=0.5, the random half should be
        # able to reach other departments.
        positives = [(8, 2010, 6)]
        keys = _generate_negative_keys(
            positives, n=400, positive_keys=set(positives),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            hard_frac=0.5, time_window=12, rng=random.Random(6),
        )
        depts_seen = {d for d, _, _ in keys}
        assert depts_seen - {8}, "random coverage should reach depts beyond the seed"


class TestQuantity:
    def test_generates_up_to_n(self):
        positives = [(8, 2010, 6), (13, 2015, 3), (47, 2000, 9)]
        keys = _generate_negative_keys(
            positives, n=150, positive_keys=set(positives),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            rng=random.Random(7),
        )
        assert len(keys) == 150

    def test_no_positive_seeds_falls_back_to_random(self):
        keys = _generate_negative_keys(
            [], n=50, positive_keys=set(),
            dept_codes=DEPTS, min_year=MIN_Y, max_year=MAX_Y,
            rng=random.Random(8),
        )
        assert len(keys) == 50
        assert all(d in DEPTS for d, _, _ in keys)
