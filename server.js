const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Fallback to parse a readable product title directly from the Shopee URL segments.
 * Shopee URLs usually look like: https://shopee.vn/Ten-San-Pham-i.12345.678910
 */
function getTitleFallbackFromUrl(urlStr) {
  try {
    const parsedUrl = new URL(urlStr);
    const pathname = parsedUrl.pathname;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'Sản phẩm Shopee';

    const lastSegment = segments[segments.length - 1];
    
    // Shopee standard link: name-i.shop_id.product_id
    if (lastSegment.includes('-i.')) {
      const titlePart = lastSegment.split('-i.')[0];
      return decodeURIComponent(titlePart).replace(/-/g, ' ');
    }
    
    // Other formats or short links: decode and replace dashes
    return decodeURIComponent(lastSegment).replace(/-/g, ' ').substring(0, 80);
  } catch (e) {
    return 'Sản phẩm Shopee';
  }
}

/**
 * Resolves redirects and extracts Shopee page metadata.
 */
async function scrapeShopeeMetadata(urlStr) {
  try {
    // Validate URL structure
    new URL(urlStr);

    const response = await axios.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 8000,
      maxRedirects: 5
    });

    const finalUrl = response.request.res.responseUrl || urlStr;
    const html = response.data;
    const $ = cheerio.load(html);

    // Extract Open Graph tags
    let title = $('meta[property="og:title"]').attr('content') || $('title').text() || '';
    let image = $('meta[property="og:image"]').attr('content') || '';
    let description = $('meta[property="og:description"]').attr('content') || '';

    title = title.trim();
    
    // Clean Shopee suffix from titles if present (e.g. "Mua ngay sản phẩm trên Shopee...")
    if (title.includes(' | Shopee Việt Nam')) {
      title = title.replace(' | Shopee Việt Nam', '');
    }

    // If scraping returned empty or generic title, try parsing from final resolved URL
    if (!title || title.toLowerCase() === 'shopee' || title.toLowerCase().includes('đang chuyển hướng')) {
      title = getTitleFallbackFromUrl(finalUrl);
    }

    return {
      success: true,
      title: title,
      image: image,
      description: description.substring(0, 150),
      finalUrl: finalUrl
    };
  } catch (error) {
    console.error(`Metadata scraping failed for URL: ${urlStr}. Error: ${error.message}`);
    
    // If request failed (blocked or offline), still try to parse the title from the URL string
    const fallbackTitle = getTitleFallbackFromUrl(urlStr);
    return {
      success: false,
      title: fallbackTitle,
      image: '',
      description: 'Không thể tải mô tả chi tiết từ Shopee.',
      finalUrl: urlStr,
      error: error.message
    };
  }
}

// Endpoint to scrape metadata from a Shopee link
app.post('/api/scrape-metadata', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  const metadata = await scrapeShopeeMetadata(url);
  return res.json(metadata);
});

// Fallback to index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Shopee Affiliate Converter Server started!`);
  console.log(`   Local URL: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
