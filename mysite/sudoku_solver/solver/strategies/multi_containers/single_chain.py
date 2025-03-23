import itertools
from typing import Collection, Iterable, Mapping

from ... import Cell, Container, Grid
from ..exceptions import StrategyException
from .multi_containers_strategy import MultiContainersStrategy


class SingleChain(MultiContainersStrategy):
    """Build conjugate pairs chains.
    Color chain: color any cell. Linked cells has opposite color (until all chain cells are colored)

    Color removal: two cells with the same color appears in same container (Color Wrap) -
    remove candidates with this color
    Witness removal: uncolored cell sees cells of opposite colors (Color Trap) - remove uncolored cell candidate
    """

    def __init__(self, grid: Grid):
        super().__init__(grid, 2)

    def __str__(self) -> str:
        return "Single Chain/Simple Coloring"

    def _get_containers_subsets(self) -> Iterable[tuple[str, Iterable[Container]]]:
        return (("all", itertools.chain(self._grid.rows, self._grid.columns, self._grid.boxes)),)

    def _solve_cell_subsets(self, containers_type: str, candidate: int, cells_subsets: list[set[Cell]]) -> bool:
        for chain in self._build_chains(cells_subsets):
            splitted_chain = self._split_chain(chain)
            result = self._remove_chain_color(chain, splitted_chain, candidate) or self._remove_chain_witness(
                chain, splitted_chain, candidate
            )
            if result:
                self._logger.debug("%s: Chain: %s", self, chain)
                self._logger.debug("%s: Splitted chain: %s", self, splitted_chain.items())
                return True
        return False

    def _build_chains(self, cells_pairs: Collection[set[Cell]]) -> list[list[tuple[Cell, bool]]]:
        cells = {cell for cells in cells_pairs for cell in cells}
        result: list[list[tuple[Cell, bool]]] = []
        while cells:
            chain = self._build_chain(cells_pairs, cells)
            cells = cells - {cell for cell, _ in chain}
            if len(chain) >= 3:  # Chain with length < 3 is senseless
                result.append(chain)
        return result

    def _build_chain(
        self,
        cells_pairs: Collection[set[Cell]],
        cells: set[Cell],
        current_cell: Cell | None = None,
        color: bool = False,
    ) -> list[tuple[Cell, bool]]:
        if not cells:
            return [(current_cell, color)] if current_cell else []  # empty cells set on 1st run -> []
        if not current_cell:  # first run: protect cells
            cells_buf = cells.copy()
            current_cell = cells_buf.pop()
        else:
            cells_buf = cells
        for cell in cells_buf:
            if {current_cell, cell} not in cells_pairs:
                continue
            cells_buf.remove(cell)
            result1 = self._build_chain(cells_pairs, cells_buf, current_cell, color)
            result2 = self._build_chain(cells_pairs, cells_buf, cell, not color)
            return result1 + result2
        return [(current_cell, color)]

    def _split_chain(self, chain: Collection[tuple[Cell, bool]]) -> dict[Container, list[tuple[Cell, bool]]]:
        result: dict[Container, list[tuple[Cell, bool]]] = {}
        for cell, color in chain:
            for cont in (self._grid.get_row(cell), self._grid.get_column(cell), self._grid.get_box(cell)):
                if cont not in result:
                    result[cont] = []
                result[cont].append((cell, color))
        return result

    def _remove_chain_color(
        self,
        chain: Collection[tuple[Cell, bool]],
        splitted_chain: Mapping[Container, Collection[tuple[Cell, bool]]],
        candidate: int,
    ) -> bool:
        for cont, chain_cells in splitted_chain.items():
            if len(chain_cells) == 1:
                continue
            colors = [color for _, color in chain_cells]
            if colors.count(True) > 1 and colors.count(False) > 1:
                raise StrategyException(
                    f"{self}: {candidate}. Color removal: both colors appears twice in {cont} for {chain=}"
                )
            color_to_delete = True if colors.count(True) > 1 else (False if colors.count(False) > 1 else None)
            if color_to_delete is None:
                continue
            affected_cells = [cell for cell, color in chain if color == color_to_delete]
            self._logger.info(
                "%s: %s. Color removal: %s appears twice in %s. Affected cells: %s",
                self,
                candidate,
                color_to_delete,
                cont,
                affected_cells,
            )
            for cell in affected_cells:
                cell.candidates -= {candidate}
            return True
        return False

    def _remove_chain_witness(
        self,
        chain: Iterable[tuple[Cell, bool]],
        splitted_chain: Mapping[Container, Collection[tuple[Cell, bool]]],
        candidate: int,
    ) -> bool:
        cells = [cell for cell, _ in chain]
        affected_cells: list[Cell] = []
        for cell in self._grid.filter_cells(has_candidate=candidate):
            if cell in cells:
                continue
            colors: set[bool] = set()
            for cont in (self._grid.get_row(cell), self._grid.get_column(cell), self._grid.get_box(cell)):
                if cont not in splitted_chain:
                    continue
                colors |= {color for _, color in splitted_chain[cont]}
                if len(colors) == 2:
                    affected_cells.append(cell)
                    break
        if not affected_cells:
            return False
        self._logger.info("%s: %d. Witness removal: %s can see both colors", self, candidate, affected_cells)
        for cell in affected_cells:
            cell.candidates -= {candidate}
        return True
