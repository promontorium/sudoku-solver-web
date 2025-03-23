import logging
from itertools import combinations
from typing import Iterable

from ... import Cell, Container, Grid
from ..exceptions import StrategyException
from .multi_containers_strategy import MultiContainersStrategy


class BasicFish(MultiContainersStrategy):
    """When there are only [2, SIZE] possible cells for a candidate in SIZE different Rows/Columns,
    and these cells also lie in SIZE different Columns/Rows,
    then this candidate can be elliminated from other Columns/Rows Cells

    X-Wing:    2 Rows/Columns, 2 Columns/Rows
    Swordfish: 3 Rows/Columns, 3 Columns/Rows
    Jellyfish: 4 Rows/Columns, 4 Columns/Rows
    Squirmbag: 5 Rows/Columns, 5 Columns/Rows
    Whale:     6 Rows/Columns, 6 Columns/Rows
    Leviathan: 7 Rows/Columns, 7 Columns/Rows

    Basic Fish larger than Jellyfish are of course possible, but unnecessary:
    for any larger fish a complementary smaller one will exist.
    """

    def __init__(self, grid: Grid, subset_length: int):
        super().__init__(grid, subset_length)
        if self._subset_length < 2 or self._subset_length > 7:
            raise StrategyException(f"{self}: unexpected subset length {self._subset_length}")
        self._ROWS_GROUP = "rows"
        self._COLUMNS_GROUP = "cols"

    def __str__(self) -> str:
        BASIC_FISHES = {2: "X-Wing", 3: "Swordfish", 4: "Jelyfish", 5: "Squirmbag", 6: "Whale", 7: "Leviathan"}
        return BASIC_FISHES.get(self._subset_length, "BASIC_FISH")

    def _get_containers_subsets(self) -> Iterable[tuple[str, Iterable[Container]]]:
        return ((self._ROWS_GROUP, self._grid.rows), (self._COLUMNS_GROUP, self._grid.columns))

    def _solve_cell_subsets(self, containers_type: str, candidate: int, cells_subsets: list[set[Cell]]) -> bool:
        for cells_subsets_combination in combinations(cells_subsets, self._subset_length):
            cells = [cell for cells_subset in cells_subsets_combination for cell in cells_subset]
            affected_conts = self._get_affected_containers(cells, containers_type)
            if not affected_conts:
                continue
            affected_cells = [
                cell
                for cont in affected_conts
                for cell in cont.filter_cells(has_candidate=candidate)
                if cell not in cells
            ]
            if not affected_cells:
                continue
            base_conts = self._get_base_containers(cells, containers_type)
            self._logger.info(
                "%s: %d. Base: %s %s %s. Affected: %s",
                self,
                candidate,
                base_conts,
                affected_conts,
                cells,
                affected_cells,
            )
            if self._logger.isEnabledFor(logging.DEBUG):
                for cont in base_conts | affected_conts:
                    self._logger.debug(
                        f"{self}: {cont}: {[(cell, cell.candidates) for cell in cont.filter_cells(solved=False)]}"
                    )
            for cell in affected_cells:
                cell.candidates -= {candidate}
            return True
        return False

    def _get_base_containers(self, subsets_cells: Iterable[Cell], conts_group_type: str) -> set[Container]:
        match conts_group_type:
            case self._ROWS_GROUP:
                result = {self._grid.get_row(cell) for cell in subsets_cells}
            case self._COLUMNS_GROUP:
                result = {self._grid.get_column(cell) for cell in subsets_cells}
            case _:
                raise StrategyException(f"{self}: Unexpected base containsers group type {conts_group_type}")
        if len(result) != self._subset_length:
            raise StrategyException(f"{self}: Internal error")
        return result

    def _get_affected_containers(self, subsets_cells: Iterable[Cell], conts_group_type: str) -> set[Container]:
        match conts_group_type:
            case self._ROWS_GROUP:
                result = {self._grid.get_column(cell) for cell in subsets_cells}
            case self._COLUMNS_GROUP:
                result = {self._grid.get_row(cell) for cell in subsets_cells}
            case _:
                raise StrategyException(f"{self}: Unexpected affected containsers group type {conts_group_type}")
        return result if len(result) == self._subset_length else set()
