import itertools
from typing import Collection, Iterable, Sequence

from ... import Cell, Container, Grid
from ..exceptions import StrategyException
from .multi_containers_strategy import MultiContainersStrategy


class XChain(MultiContainersStrategy):
    """Single-digit solving technique which uses a chain
    consisting of links that alternate between strong links and weak links,
    with the starting and ending link being strong.
    The target digit can be eliminated from any cell that is seen by both ends of the X-Chain.
    """

    def __init__(self, grid: Grid):
        super().__init__(grid, 2)

    def __str__(self) -> str:
        return "X-Chain"

    def _get_containers_subsets(self) -> Iterable[tuple[str, Iterable[Container]]]:
        return (("all", itertools.chain(self._grid.rows, self._grid.columns, self._grid.boxes)),)

    def _solve_cell_subsets(self, containers_type: str, candidate: int, cells_subsets: list[set[Cell]]) -> bool:
        for chain in self._build_x_chains(cells_subsets):
            cells = self._get_affected_cells(candidate, chain)
            if not cells:
                continue
            self._logger.info("%s: %d. Affected cells: %s", self, candidate, cells)
            self._logger.debug("%s: Chain: %s", self, chain)
            for cell in cells:
                cell.candidates -= {candidate}
            return True
        return False

    def _build_x_chains(self, cells_pairs: Collection[set[Cell]]) -> list[tuple[Cell, ...]]:
        result: list[tuple[Cell, ...]] = []
        cells = {cell for cells in cells_pairs for cell in cells}
        for cell in cells:
            result += self._build_chains(cells_pairs, cells - {cell}, (cell,), True)
        return self._adjust_chains(result)

    def _build_chains(
        self, cells_pairs: Collection[set[Cell]], cells: set[Cell], r: tuple[Cell, ...], link: bool
    ) -> list[tuple[Cell, ...]]:
        if not r:
            raise StrategyException(f"{self}: Build chain internal error")
        result: list[tuple[Cell, ...]] = []
        links = self._find_links(r[-1], cells, cells_pairs, link)
        for cell in links:
            result += self._build_chains(cells_pairs, cells - {cell}, r + (cell,), not link)
        if not links and len(r) > 3:  # chain with length < 3 is senseless
            result.append(r if not (len(r) % 2) else r[:-1])  # remove weak link from chain end
        return result

    def _find_links(self, cell: Cell, cells: set[Cell], cells_pairs: Collection[set[Cell]], link: bool) -> list[Cell]:
        if link:
            return [c for c in cells if {c, cell} in cells_pairs]
        neighbors = self._grid.get_neighbors(cell, solved=False) & cells
        return [neighbor for neighbor in neighbors if {neighbor, cell} not in cells_pairs]

    def _adjust_chains(self, chains: Iterable[tuple[Cell, ...]]) -> list[tuple[Cell, ...]]:
        result: list[tuple[Cell, ...]] = []
        for seq in sorted(chains, key=len, reverse=True):
            if self._is_subchain(seq, result) or self._is_subchain(tuple(reversed(seq)), result):
                continue
            result.append(seq)
        return result

    def _is_subchain(self, chain: tuple[Cell, ...], chains: Iterable[tuple[Cell, ...]]) -> bool:
        for base_chain in chains:
            if any(base_chain[i : i + len(chain)] == chain for i in range(len(base_chain) - len(chain) + 1)):
                return True
        return False

    def _get_affected_cells(self, candidate: int, chain: Sequence[Cell]) -> list[Cell]:
        return [
            cell for cell in self._grid.filter_cells(has_candidate=candidate) if self._is_affected_cell(cell, chain)
        ]

    def _is_affected_cell(self, cell: Cell, chain: Sequence[Cell]) -> bool:
        """Affected cell can see chain/subchain(min length 4 cells) endpoints that start and end with a strong link
        Chain: EVEN_IDX_cell<=>next_cell - strong link, ODD_IDX_cell<->next_cell - weak link
        """
        if cell in chain:
            return False
        endpoints = self._grid.get_neighbors(cell, solved=False) & set(chain)
        idxs = [chain.index(cell) for cell in endpoints]
        try:
            max_odd = max(filter(lambda idx: idx % 2, idxs))
            min_even = min(filter(lambda idx: not idx % 2, idxs))
        except ValueError:
            return False
        return max_odd - min_even > 2
