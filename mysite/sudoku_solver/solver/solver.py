from logging import getLogger

from ..sudoku import Grid
from .basic_fish import BasicFish
from .box_line_reduction import BoxLineReduction
from .hidden_single import HiddenSingle
from .hidden_subset import HiddenSubset
from .naked_single import NakedSingle
from .naked_subset import NakedSubset
from .pointing_subset import PointingSubset
from .single_chain import SingleChain
from .strategy import Strategy
from .x_chain import XChain
from .xyz_wing import XYZWing
from .y_wing import YWing


class Solver:
    def __init__(self, grid: Grid):
        self._logger = getLogger(__name__)
        self._grid = grid
        self._solvers: tuple[Strategy, ...] = (
            NakedSingle(self._grid),
            HiddenSingle(self._grid),
            NakedSubset(self._grid, 2),
            HiddenSubset(self._grid, 2),
            NakedSubset(self._grid, 3),
            HiddenSubset(self._grid, 3),
            NakedSubset(self._grid, 4),
            HiddenSubset(self._grid, 4),
            PointingSubset(self._grid),
            BoxLineReduction(self._grid),
            BasicFish(self._grid, 2),
            SingleChain(self._grid),
            YWing(self._grid),
            BasicFish(self._grid, 3),
            BasicFish(self._grid, 4),
            XYZWing(self._grid),
            XChain(self._grid),
        )

    def __str__(self) -> str:
        return "Solver"

    def solve(self) -> bool:
        self._logger.info("%s: Solving", self)
        if not self._grid.is_consistent:
            self._logger.warning("%s: %s is inconsistent", self, self._grid)
            return False
        step = 0
        while not self._grid.is_solved:
            step += 1
            self._logger.debug("%s: Step %d", self, step)
            if any(self._grid.filter_cells(solved=False, candidates=frozenset())):
                self._logger.warning("%s: %s has no candidates cells", self, self._grid)
                return False
            if not any(solver.solve() for solver in self._solvers):
                self._logger.warning("%s: no step %d progress", self, step)
                return False
        self._logger.info("%s: Total steps %d", self, step)
        return bool(step)

    def solve_step(self) -> bool:
        self._logger.info("%s: Solving step", self)
        if not self._grid.is_consistent:
            self._logger.warning("%s: %s is inconsistent", self, self._grid)
            return False
        if any(self._grid.filter_cells(solved=False, candidates=frozenset())):
            self._logger.warning("%s: %s has no candidates cells", self, self._grid)
            return False
        if self._grid.is_solved:
            self._logger.warning("%s: %s is solved", self, self._grid)
            return False
        return any(solver.solve() for solver in self._solvers)
