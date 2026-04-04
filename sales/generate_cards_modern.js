const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

function convertModernToCards(inputFile, outputFile) {
    const html = fs.readFileSync(inputFile, 'utf-8');
    const $ = cheerio.load(html, { decodeEntities: false }); 
    let convertedCount = 0;

    // Create the wrapper for the grid
    const $gridWrapper = $('<div class="horse-card-grid"></div>');

    // Hunt for the modern divs instead of tables!
    $('.horse-listing').each((i, listing) => {
        const $listing = $(listing);
        
        // 1. Extract Image
        const $img = $listing.find('.horse-image img');
        const imgSrc = $img.attr('src') || '';
        
        // 2. Extract Name
        const $details = $listing.find('.horse-details');
        const name = $details.find('h3').text().trim() || $details.find('strong').first().text().trim();
        
        // Find the horse's folder name from the image path
        let horseFolder = '';
        if (imgSrc.includes('/horses/')) {
            const parts = imgSrc.split('/');
            const horseIndex = parts.indexOf('horses') + 1;
            if (parts[horseIndex]) horseFolder = parts[horseIndex];
        }

        // 3. Extract Lineage and Stats (first paragraph)
        const $paragraphs = $details.find('p');
        const firstParaHtml = $paragraphs.eq(0).html() || '';
        const lines = firstParaHtml.split(/<br\s*\/?>/i).map(l => l.replace(/<[^>]+>/g, '').trim()).filter(l => l);
        
        const lineage = lines[0] || '';
        const statsString = lines[1] || ''; 
        
        // Break stats into tags
        const statsArray = statsString.split(' ').filter(s => s.trim() !== '');
        const tagsHtml = statsArray.map(stat => `<span class="tag">${stat}</span>`).join('');

        // 4. Extract the Story (middle paragraphs)
        let storyHtml = '';
        for (let j = 1; j < $paragraphs.length - 1; j++) {
            storyHtml += `<p>${$paragraphs.eq(j).html().replace(/<br\s*\/?>/ig, '')}</p>\n`;
        }

        // 5. Extract Links (last paragraph)
        const lastParaHtml = $paragraphs.last().html() || '';
        const $links = cheerio.load(lastParaHtml);
        let pedigreeLink = '#';
        let videoLink = '#';
        
        $links('a').each((idx, a) => {
            const text = $links(a).text().toLowerCase();
            const href = $links(a).attr('href');
            if (text.includes('pedigree')) pedigreeLink = href;
            if (text.includes('video')) videoLink = href;
        });

        // --- BUILD THE NEW STORY PAGE ---
        if (horseFolder) {
            const storyPath = path.resolve(__dirname, `../Horses/${horseFolder}/story.html`);
            const fullStoryPage = `
<!DOCTYPE html>
<html>
<head>
    <title>${name} - Our Story</title>
    <link href="../../../styles.css" rel="stylesheet" type="text/css">
</head>
<body>
    <div id="content-box">
        <div id="content" style="padding: 40px; background: #fff; border-radius: 8px;">
            <h1>The Story of ${name}</h1>
            <p><em>${lineage}</em></p>
            <hr style="margin: 20px 0;">
            ${storyHtml}
            <br>
            <a href="../../../sales/index.html" class="btn btn-primary">Back to Sales</a>
        </div>
    </div>
</body>
</html>`;
            // Only create the story file if the directory exists
            const horseDir = path.resolve(__dirname, `../Horses/${horseFolder}`);
            if (fs.existsSync(horseDir)) {
                fs.writeFileSync(storyPath, fullStoryPage.trim(), 'utf-8');
            }
        }

        // --- BUILD THE NEW CARD ---
        const newCard = `
<div class="horse-card">
    <div class="card-image-wrapper">
        <img src="${imgSrc}" alt="${name}">
    </div>
    
    <div class="card-info">
        <h3>${name}</h3>
        <p class="lineage">${lineage}</p>
        
        <div class="horse-tags">
            ${tagsHtml}
        </div>
        
        <div class="card-actions">
            ${storyHtml.trim() ? `<a href="../horses/${horseFolder}/story.html" class="btn btn-primary">Story</a>` : ''}
            <a href="${pedigreeLink}" class="btn btn-secondary">Pedigree</a>
            <a href="../horses/${horseFolder}/photos/" class="btn btn-secondary">Photos</a>
            ${videoLink !== '#' ? `<a href="${videoLink}" target="_blank" class="btn btn-video">Video</a>` : ''}
        </div>
    </div>
</div>`;

        // Add the card to our grid and remove the old listing
        $gridWrapper.append(newCard);
        $listing.remove();
        convertedCount++;
    });

    // Insert the grid where the listings used to be
    $('#content').append($gridWrapper);

    // Save the new file
    fs.writeFileSync(outputFile, $.html(), 'utf-8');
    
    console.log(`\nNailed it! Converted ${convertedCount} modern listings to cards.`);
    console.log(`Saved the new modern layout to: ${outputFile}\n`);
}

// Run it on your modern file!
const inputHtmlFile = 'sales_modern.html';         
const outputHtmlFile = 'sales_modern_cards.html'; 

convertModernToCards(inputHtmlFile, outputHtmlFile);