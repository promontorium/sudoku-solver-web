from abc import abstractmethod

from .... import Cell, Container
from ..basic_strategy import BasicStrategy


class IntersectionStrategy(BasicStrategy):
    @abstractmethod
    def _get_affected_container(self, cells: tuple[Cell, ...]) -> Container | None: ...

    def _solve_container(self, container: Container) -> bool:
        for cand, cells in self._get_candidate_cells_map(container, min_cells=2, max_cells=3).items():
            affected_cont = self._get_affected_container(cells)
            if not affected_cont:
                continue
            affected_cells = set(affected_cont.filter_cells(has_candidate=cand)) - set(
                container.filter_cells(solved=False)
            )
            if not affected_cells:
                continue
            self._logger.info(
                "%s[%s]: %d. Base: %s %s. Affected: %s %s",
                self,
                self._SUBSET_NAME[len(cells)],
                cand,
                container,
                cells,
                affected_cont,
                affected_cells,
            )
            for cell in affected_cells:
                cell.candidates -= {cand}
            return True
        return False
