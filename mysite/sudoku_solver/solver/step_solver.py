from . import Grid
from .solver import Solver
from .strategies import (
    BasicFish,
    BoxLineReduction,
    HiddenSingle,
    HiddenSubset,
    NakedSingle,
    NakedSubset,
    PointingSubset,
    SingleChain,
    XChain,
    XYZWing,
    YWing,
)


class StepSolver(Solver):
    def __init__(self, grid: Grid):
        super().__init__(grid)
        self._solvers = [
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
