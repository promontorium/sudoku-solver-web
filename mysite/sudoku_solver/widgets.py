from typing import Any, Mapping

from django.core.files.uploadedfile import UploadedFile
from django.forms import widgets
from django.template.loader import render_to_string
from django.utils.datastructures import MultiValueDict
from django.utils.safestring import SafeString

from .sudoku import Grid
from .utils.board_utils import decode_board, encode_board


class PasswordWidget(widgets.PasswordInput):
    template_name = "password-widget.html"

    class Media:
        css = {"all": ("styles/password-widget.css",)}
        js = ("js/password-widget.js",)


class BoardWidget(widgets.Widget):
    template_name = "admin/board-widget.html"

    class Media:
        css = {"all": ("styles/board-widget.css",)}
        js = ("js/board-widget.js",)

    def render(self, name: str, value: str, attrs: dict[str, Any] | None = None, renderer: Any = None) -> SafeString:
        if value:
            grid = decode_board(value)
            board = [
                [{"value": cell.value, "is_given": cell.is_given, "candidates": cell.candidates} for cell in row.cells]
                for row in grid.rows
            ]
        else:
            board = [[{"value": 0, "is_given": False, "candidates": []}] * 9] * 9
        return render_to_string(self.template_name, {"board": board, "name": name})

    def value_from_datadict(self, data: Mapping[str, Any], files: MultiValueDict[str, UploadedFile], name: str) -> str:
        board = [0] * 81
        for i in range(9):
            for j in range(9):
                v = data.get(f"{name}_{i}_{j}")
                if isinstance(v, str) and v.startswith("!"):
                    board[i * 9 + j] = int(v[1:])
        grid = Grid(board)
        for i in range(9):
            for j in range(9):
                v = data.get(f"{name}_{i}_{j}")
                if not v or not isinstance(v, str):
                    continue
                if v.isnumeric():
                    grid.cells[i * 9 + j].value = int(v)
                elif v.startswith("#"):
                    grid.cells[i * 9 + j].candidates = frozenset(map(int, v[1:]))
        return encode_board(grid)
