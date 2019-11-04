import requests
import re
from bs4 import BeautifulSoup

from google_search.search_response import SearchResult, SearchResponse


class GoogleSearchClient:
    USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
    GOOGLE_URL = "https://google.com/search"
    RESULTS_SELECTOR = 'div.r'
    TITLE_INSIDE_RESULT_SELECTOR = 'h3'
    DEFAULT_HEADERS = {
        'user-agent': USER_AGENT,
        "Accept-Language": "en-US,en;q=0.5",
    }

    def search(self, query: str) -> SearchResponse:
        r = requests.get(self.GOOGLE_URL + "?q=" + query, headers=self.DEFAULT_HEADERS)
        soup = BeautifulSoup(r.text, features='lxml')
        return self.get_search_results(soup)

    def get_search_results(self, soup: BeautifulSoup) -> SearchResponse:
        search_response = SearchResponse()
        for result in soup.select(self.RESULTS_SELECTOR):
            url = result.select('a')[0]['href']
            tittle = result.select(self.TITLE_INSIDE_RESULT_SELECTOR)[0].text
            search_response.add_result(SearchResult(tittle, url))
        return search_response

    def total_num_results(self, soup: BeautifulSoup):
        total_string = soup.select('#resultStats')[0].text
        return int(re.search("(([0-9]+[', ])*[0-9]+)", total_string).group(1).replace(',', ''))


def main():
    searcher = GoogleSearchClient()
    print(searcher.search("hello"))


if __name__ == "__main__":
    main()
