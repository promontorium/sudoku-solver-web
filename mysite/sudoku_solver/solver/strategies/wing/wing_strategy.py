from abc import abstractmethod
from functools import reduce
from itertools import combinations, product
from typing import Iterable

from ... import Cell
from ..exceptions import StrategyException
from ..strategy import Strategy


class WingStrategy(Strategy):
    @abstractmethod
    def _get_pivot_cands_count(self) -> int: ...

    @abstractmethod
    def _get_base_cells(self, pivot: Cell, pincers: tuple[Cell, Cell]) -> Iterable[Cell]: ...

    def solve(self) -> bool:
        for pivot in self._grid.filter_cells(solved=False):
            if len(pivot.candidates) != self._get_pivot_cands_count():
                continue
            pincers = self._get_pincers(pivot)
            if not pincers:
                continue
            for cands1, cands2 in combinations(pincers, 2):
                for pincer1, pincer2 in product(pincers[cands1], pincers[cands2]):
                    if self._solve(pivot, pincer1, pincer2):
                        return True
        return False

    def _get_pincers(self, pivot: Cell) -> dict[tuple[int, ...], set[Cell]]:
        result: dict[tuple[int, ...], set[Cell]] = {}
        cands_combinations = tuple(combinations(pivot.candidates, self._get_pivot_cands_count() - 1))
        for cont in (self._grid.get_row(pivot), self._grid.get_column(pivot), self._grid.get_box(pivot)):
            cand_cells_map = self._get_candidate_cells_map(cont, min_cells=2, candidates=pivot.candidates)
            for cands_combination in cands_combinations:
                cands_combination_cells = [set(cand_cells_map[cand]) for cand in cands_combination]
                cells = reduce(lambda cells1, cells2: cells1 & cells2, cands_combination_cells)
                pincers = {cell for cell in cells if cell.candidates != pivot.candidates and len(cell.candidates) == 2}
                if not pincers:
                    continue
                if cands_combination not in result:
                    result[cands_combination] = set()
                result[cands_combination] |= pincers
        return result if len(result) > 1 else {}

    def _solve(self, pivot: Cell, pincer1: Cell, pincer2: Cell) -> bool:
        # No sense to process pincers sharing same container
        if (
            self._grid.get_row(pincer1) == self._grid.get_row(pincer2)
            or self._grid.get_column(pincer1) == self._grid.get_column(pincer2)
            or self._grid.get_box(pincer1) == self._grid.get_box(pincer2)
        ):
            return False
        pincers_common_cands = pincer1.candidates & pincer2.candidates
        if not pincers_common_cands:
            return False
        if len(pincers_common_cands) > 1:
            raise StrategyException(f"{self}: Internal error. Incorrect pincers")
        cand = next(iter((pincers_common_cands)))
        affected_cells = self._get_affected_cells(cand, pivot, (pincer1, pincer2))
        if not affected_cells:
            return False
        self._logger.info(
            "%s: %s. Pivot/Hinge: %s %s. Pincers/Wings: %s %s %s %s. Affected: %s",
            self,
            cand,
            pivot,
            pivot.candidates,
            pincer1,
            pincer1.candidates,
            pincer2,
            pincer2.candidates,
            affected_cells,
        )
        for cell in affected_cells:
            self._logger.debug("%s: %s %s", self, cell, cell.candidates)
            cell.candidates -= {cand}
        return True

    def _get_affected_cells(self, candidate: int, pivot: Cell, pincers: tuple[Cell, Cell]) -> set[Cell]:
        cells = self._get_base_cells(pivot, pincers)
        cells_groups = [self._grid.get_neighbors(cell, has_candidate=candidate) for cell in cells]
        return reduce(lambda cells1, cells2: cells1 & cells2, cells_groups) - {pivot, *pincers}
