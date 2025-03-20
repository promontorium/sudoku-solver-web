from ..sudoku import Grid
from .solver import Solver
from .strategies.basic_fish import BasicFish
from .strategies.box_line_reduction import BoxLineReduction
from .strategies.hidden_single import HiddenSingle
from .strategies.hidden_subset import HiddenSubset
from .strategies.naked_single import NakedSingle
from .strategies.naked_subset import NakedSubset
from .strategies.pointing_subset import PointingSubset
from .strategies.single_chain import SingleChain
from .strategies.strategy import Strategy
from .strategies.x_chain import XChain
from .strategies.xyz_wing import XYZWing
from .strategies.y_wing import YWing


class StepSolver(Solver):
    def __init__(self, grid: Grid):
        super().__init__(grid)
        self._solvers: list[Strategy] = [
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
        ]

    def __str__(self) -> str:
        return "Step solver"

    def _solve(self) -> bool:
        if not self._grid.is_consistent:
            self._logger.warning("%s: %s is inconsistent", self, self._grid)
            return False
        if any(self._grid.filter_cells(solved=False, candidates=frozenset())):
            self._logger.warning("%s: %s has no candidates cells", self, self._grid)
            return False
        if self._grid.is_solved:
            self._logger.warning("%s: %s is already solved", self, self._grid)
            return False
        return any(solver.solve() for solver in self._solvers)
