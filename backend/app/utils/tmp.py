from google_scraper import GoogleScraper


if __name__ == "__main__":
    gs = GoogleScraper()

    rslts = gs.search("facebook", 10)

    for res in rslts:
        print(f"url : {res["link"]}")