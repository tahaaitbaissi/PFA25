from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import random

class GoogleScraper:
    def __init__(self):
        self.options = Options()
        self._configure_options()
        self.driver = webdriver.Chrome(options=self.options)
        
    def _configure_options(self):
        """Configure Chrome options to avoid detection"""
        self.options.add_argument("--headless=new")  # New headless mode
        self.options.add_argument("--disable-blink-features=AutomationControlled")
        self.options.add_argument("--window-size=1920,1080")
        self.options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.160 Safari/537.36")
        self.options.add_experimental_option("excludeSwitches", ["enable-automation"])
        self.options.add_experimental_option('useAutomationExtension', False)
        
    def search(self, query: str, num_results: int = 10) -> list:
        """Scrape Google using Selenium with human-like behavior"""
        results = []
        url = f"https://www.google.com/search?q={query}&num={num_results}"
        
        try:
            self.driver.get(url)
            self._human_like_interaction()
            
            # Handle consent popup (EU/California)
            self._handle_cookie_popup()
            
            # Wait for results to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div.MjjYud")))
            
            # Extract results
            for result in self.driver.find_elements(By.CSS_SELECTOR, "div.MjjYud"):
                try:
                    title = result.find_element(By.CSS_SELECTOR, "h3.LC20lb").text
                    link = result.find_element(By.CSS_SELECTOR, "a").get_attribute("href")
                    
                    # Clean Google redirects
                    if "/url?q=" in link:
                        link = link.split("/url?q=")[1].split("&")[0]
                    
                    # Get description (multiple possible classes)
                    desc = result.find_elements(By.CSS_SELECTOR, "div.VwiC3b, div.yDYNvb, div.MUxGbd")
                    description = desc[0].text if desc else None
                    
                    results.append({
                        "title": title,
                        "link": link,
                        "description": description
                    })
                    
                    if len(results) >= num_results:
                        break
                        
                except Exception as e:
                    continue
                    
            return results
            
        except Exception as e:
            print(f"Error during scraping: {e}")
            return []
            
        finally:
            self.driver.quit()
    
    def _human_like_interaction(self):
        """Simulate human behavior to avoid detection"""
        time.sleep(random.uniform(1, 3))
        # Scroll randomly
        for _ in range(random.randint(1, 3)):
            self.driver.execute_script(f"window.scrollBy(0, {random.randint(200, 500)})")
            time.sleep(random.uniform(0.5, 1.5))
    
    def _handle_cookie_popup(self):
        """Handle cookie consent popups if they appear"""
        try:
            # Try different consent button selectors
            for selector in ['button#L2AGLb', 'div#CXQnmb button', 'button.truste-button1']:
                try:
                    WebDriverWait(self.driver, 3).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))).click()
                    time.sleep(1)
                    break
                except:
                    continue
        except:
            pass