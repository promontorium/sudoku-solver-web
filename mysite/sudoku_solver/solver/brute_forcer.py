import heapq

from . import Grid
from .solver import Solver


# inspired by https://leetcode.com/problems/sudoku-solver/
class BruteForcer(Solver):
    def __init__(self, grid: Grid):
        super().__init__(grid)
        self._temp_grid = self._create_temp_grid()
        self._temp_grid.init_candidates()
        self._temp_grid.history_manager.enable_history(redo_maxlen=0)
        self._cells = [(len(cell.candidates), cell) for cell in self._temp_grid.filter_cells(given=False)]
        heapq.heapify(self._cells)

    def __str__(self) -> str:
        return "Brute forcer"

    def _solve(self) -> bool:
        if not self._temp_grid.is_consistent:
            self._logger.warning("%s: %s is inconsistent", self, self._grid)
            return False
        res = self._solve_temp_grid()
        if res:
            self._apply_solution()
        return res

    def _create_temp_grid(self) -> Grid:
        return Grid(cell.value if cell.is_given else 0 for cell in self._grid.cells)

    def _solve_temp_grid(self) -> bool:
        if not self._cells:
            return True
        _, cell = heapq.heappop(self._cells)
        for cand in cell.candidates:
            self._temp_grid.set_value(cell, cand)
            if self._solve_temp_grid():
                return True
            self._temp_grid.history_manager.undo()
        heapq.heappush(self._cells, (len(cell.candidates), cell))
        return False

    def _apply_solution(self) -> None:
        for cell, solved_cell in zip(self._grid.cells, self._temp_grid.cells):
            if not cell.is_given:
                cell.value = solved_cell.value
