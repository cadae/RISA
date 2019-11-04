import json
from typing import List


class SearchResult:
    def __init__(self, title: str, url: str):
        self.url = url
        self.title = title

    def __str__(self):
        return str(vars(self))

    def __repr__(self):
        return self.__str__()


class SearchResponse:
    results: List[SearchResult]

    def __init__(self):
        self.results = list()

    def add_result(self, result: SearchResult):
        self.results.append(result)

    def __str__(self):
        return str(self.results)

    def to_json(self):
        return json.dumps([vars(result) for result in self.results])
