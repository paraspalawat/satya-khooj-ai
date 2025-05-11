document.addEventListener("DOMContentLoaded", () => {
  const pageTransition = document.querySelector('.page-transition');
  pageTransition.style.transform = 'translateY(-100%)';

  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  const navLinks = document.querySelectorAll('.nav-menu a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  window.addEventListener('scroll', updateActiveNavLink);
  function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - 100)) {
        current = section.getAttribute('id');
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  }

  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  animatedElements.forEach(element => observer.observe(element));

  const factCheckForm = document.getElementById('fact-check-form');
  const resultsContainer = document.getElementById('results-container');
  const verifyBtn = document.getElementById('verify-btn');

  factCheckForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const claim = document.getElementById('claim').value.trim();

    if (!claim) {
      alert('Please enter a claim to verify.');
      return;
    }

    verifyBtn.classList.add('btn-loading');
    resultsContainer.innerHTML = createLoadingPlaceholder();
    resultsContainer.classList.add('active');

    try {
      const result = await factCheckClaim(claim);
      displayResults(claim, result);
    } catch (error) {
      console.error('Error:', error);
      displayError(error.message);
    } finally {
      verifyBtn.classList.remove('btn-loading');
    }
  });

  async function factCheckClaim(claim) {
    const response = await fetch('/.netlify/functions/factCheck', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to verify claim.');
    }

    const result = await response.json();
    return result;
  }

  function displayResults(claim, result) {
    let badgeClass;
    switch(result.verdict.toUpperCase()) {
      case 'TRUE': badgeClass = 'true'; break;
      case 'FALSE': badgeClass = 'false'; break;
      case 'PARTIALLY TRUE': badgeClass = 'partial'; break;
      default: badgeClass = 'unknown';
    }

    const formattedAnalysis = highlightKeyPhrases(result.analysis);
    const sourcesList = result.sources.map(source => `<li>${source}</li>`).join('');
    const variationsSection = result.variations && result.variations !== 'N/A' ? 
      `<div class="variations">
        <h4>Variations Across Versions:</h4>
        <p>${result.variations}</p>
      </div>` : '';

    const resultHTML = `
      <div class="result-card">
        <div class="result-header">
          <h3>Fact Check Result</h3>
          <span class="result-badge ${badgeClass}">${result.verdict}</span>
        </div>
        <div class="claim-text"><strong>Claim:</strong> ${claim}</div>
        <div class="analysis"><h4>Analysis:</h4><p>${formattedAnalysis}</p></div>
        ${variationsSection}
        <div class="sources">
          <h4>Sources:</h4>
          <ul class="sources-list">${sourcesList}</ul>
        </div>
      </div>
    `;
    resultsContainer.innerHTML = resultHTML;
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function highlightKeyPhrases(text) {
    const phrases = [
      'Valmiki Ramayan', 'Ramcharitmanas', 'Tulsidas', 'Kamban', 'Adhyatma Ramayana',
      'authentic', 'evidence', 'verse', 'chapter', 'confirms', 'contradicts', 'mentions',
      'according to', 'original text', 'Sanskrit', 'translation', 'interpretation'
    ];
    let highlightedText = text;
    phrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, match => `<span class="analysis-highlight">${match}</span>`);
    });
    return highlightedText;
  }

  function displayError(errorMessage) {
    resultsContainer.innerHTML = `
      <div class="result-card">
        <div class="result-header"><h3>Error</h3><span class="result-badge false">Failed</span></div>
        <div class="analysis">
          <p>${errorMessage}</p>
          <p>Please check your API or try again.</p>
        </div>
      </div>
    `;
  }

  function createLoadingPlaceholder() {
    return `
      <div class="result-card">
        <div class="result-header"><h3>Analyzing claim...</h3></div>
        <div class="loading-content">
          <div class="loading-placeholder" style="width: 90%"></div>
          <div class="loading-placeholder" style="width: 75%"></div>
          <div class="loading-placeholder" style="width: 85%"></div>
          <div class="loading-placeholder" style="width: 60%"></div>
        </div>
      </div>
    `;
  }
});

// History logic remains the same
const historyList = document.getElementById("search-history-list");
const claimInput = document.getElementById("claim");
const clearHistoryBtn = document.getElementById("clear-history-btn");
const noHistoryMessage = document.getElementById("no-history-message");

window.addEventListener("load", () => {
  const savedHistory = JSON.parse(localStorage.getItem("ramayanHistory")) || [];
  if (savedHistory.length === 0) {
    noHistoryMessage.style.display = "block";
  } else {
    savedHistory.forEach(renderHistoryItem);
    noHistoryMessage.style.display = "none";
  }
  toggleClearButton();
});

document.getElementById("fact-check-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const claimText = claimInput.value.trim();
  if (!claimText) return;

  let history = JSON.parse(localStorage.getItem("ramayanHistory")) || [];
  if (!history.includes(claimText)) {
    history.unshift(claimText);
    localStorage.setItem("ramayanHistory", JSON.stringify(history));
    renderHistoryItem(claimText);
  }
  toggleClearButton();
});

function renderHistoryItem(text) {
  const li = document.createElement("li");
  li.textContent = text;
  li.classList.add("history-item");
  li.addEventListener("click", () => {
    claimInput.value = text;
  });
  historyList.appendChild(li);
  noHistoryMessage.style.display = "none";
}

clearHistoryBtn.addEventListener("click", () => {
  localStorage.removeItem("ramayanHistory");
  historyList.innerHTML = '';
  noHistoryMessage.style.display = "block";
  toggleClearButton();
});

function toggleClearButton() {
  const history = JSON.parse(localStorage.getItem("ramayanHistory")) || [];
  clearHistoryBtn.style.display = history.length > 0 ? 'block' : 'none';
}
