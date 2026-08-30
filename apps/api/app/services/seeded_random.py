"""Deterministic pseudo-random generator matching the TypeScript seed logic."""

from __future__ import annotations


def create_seeded_random(seed: int):
    """Return a Park-Miller generator equivalent to ``lib/seeded-random.ts``."""

    state = seed % 2_147_483_647
    if state <= 0:
        state += 2_147_483_646

    def random_value() -> float:
        nonlocal state
        state = (state * 16_807) % 2_147_483_647
        return (state - 1) / 2_147_483_646

    return random_value
