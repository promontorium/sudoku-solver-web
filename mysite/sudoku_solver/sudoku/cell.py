from logging import getLogger
from typing import Callable, Iterable

from events import Events  # type: ignore[import-untyped]

from .exceptions import SudokuException


class Cell:
    def __init__(self, value: int, i: int, j: int):
        self._logger = getLogger(__name__)
        self._events = Events()
        self._coordinates = i, j
        self._candidates: frozenset[int] = frozenset()
        self._validate_value(value)
        self._value = value
        self._is_given = self._value != 0
        self._validate_coordinates()

    def __str__(self) -> str:
        return f"r{self._coordinates[1]}c{self._coordinates[0]}"

    def __repr__(self) -> str:
        return str(self)

    def __lt__(self, other: object) -> bool:
        if isinstance(other, Cell):
            return self._coordinates < other._coordinates
        return NotImplemented

    @property
    def coordinates(self) -> tuple[int, int]:
        return self._coordinates

    @property
    def candidates(self) -> frozenset[int]:
        return self._candidates

    @candidates.setter
    def candidates(self, candidates: Iterable[int]) -> None:
        cands = frozenset(candidates)
        if self._candidates == cands:
            return
        self._logger.info("%s: Updating candidates %s -> %s", self, self._candidates, cands)
        self._assert_mutable()
        self._assert_candidates_mutable()
        for cand in cands:
            self._validate_value(cand, allow_zero=False)
        self._candidates = cands
        self._logger.debug("%s: On change: set candidates", self)
        self._events.on_change(self)

    @property
    def value(self) -> int:
        return self._value

    @value.setter
    def value(self, value: int) -> None:
        if self._value == value:
            return
        self._logger.info("%s: Updating value %d -> %d", self, self._value, value)
        self._assert_mutable()
        self._validate_value(value)
        self._value = value
        self._candidates = frozenset()
        self._logger.debug("%s: On change: set value", self)
        self._events.on_change(self)

    @property
    def is_given(self) -> bool:
        return self._is_given

    @property
    def is_solved(self) -> bool:
        return self._value != 0

    def add_on_change_handler(self, handler: Callable[["Cell"], None]) -> None:
        self._events.on_change += handler

    def remove_on_change_handler(self, handler: Callable[["Cell"], None]) -> None:
        self._events.on_change -= handler

    def get_state(self) -> tuple[int, frozenset[int]]:
        return self._value, self._candidates

    def restore(self, state: tuple[int, frozenset[int]]) -> None:
        self._logger.info("%s: Restoring %s", self, state)
        self._verify_state(state)
        self.value, self.candidates = state

    def reset(self) -> None:
        self._logger.info("%s: Resetting", self)
        if self._is_given:
            return
        self.value = 0
        self.candidates = frozenset()

    def _assert_mutable(self) -> None:
        if self.is_given:
            raise SudokuException(f"{self}: Cannot modify given cell")

    def _assert_candidates_mutable(self) -> None:
        if self.is_solved:
            raise SudokuException(f"{self}: Cannot modify solved cell candidates")

    def _validate_value(self, value: int, *, allow_zero: bool = True) -> None:
        if value not in (range(10) if allow_zero else range(1, 10)):
            raise SudokuException(f"{self}: Invalid value {value}")

    def _validate_coordinates(self) -> None:
        col, row = self._coordinates
        if col < 0 or row < 0 or col > 8 or row > 8:
            raise SudokuException(f"{self}: Invalid coordinates")

    def _verify_state(self, state: tuple[int, frozenset[int]]) -> None:
        if state[0] and state[1]:
            raise SudokuException(f"{self}: State {state} is inconcistent. Cannot set solved cell candidates")
