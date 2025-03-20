from abc import ABC, abstractmethod
from logging import getLogger

from ..sudoku import Grid, HistoryManager, as_complex_action


class Solver(ABC):
    def __init__(self, grid: Grid):
        self._grid = grid
        self._logger = getLogger(__name__)

    @abstractmethod
    def __str__(self) -> str:
        pass

    @property
    def history_manager(self) -> HistoryManager:
        return self._grid.history_manager

    @as_complex_action
    def solve(self) -> bool:
        self._logger.info("%s: Solving ...", self)
        res = self._solve()
        if res:
            self._logger.info("%s: Solved", self)
        else:
            self._logger.warning("%s: Not solved", self)
        return res

    @abstractmethod
    def _solve(self) -> bool:
        pass
