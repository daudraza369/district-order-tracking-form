# Order Entry Form - Deployment Guide

Follow these steps to deploy the order entry form and connect it to your Google Sheet.

---

## Part 1: Google Apps Script (Backend)

### Step 1.1: Create the Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename the project (e.g. "Order Entry API") by clicking "Untitled project" at the top

### Step 1.2: Add the Code

1. In the editor, delete any default code
2. Copy the entire contents of `Code.gs` from this project
3. Paste into the script editor

### Step 1.3: Configure the Script

1. At the top of `Code.gs`, update these constants:
   - **SPREADSHEET_ID**: Your sheet ID is in the URL  
     `https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`  
     For your sheet: `192Vwk9QaayUSgXWiX8t0HHl5-STyKQlD8fM3oNdcNZc`
   - **SECRET_TOKEN**: Choose a strong random string (e.g. use a password generator).  
     Example: `mySecretOrderToken2024` — **keep this private**

2. Save the project (`Ctrl+S` or File > Save)

### Step 1.4: Deploy as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Set:
   - **Description**: e.g. "Order Entry API v1"
   - **Execute as**: **Me** (your Google account)
   - **Who has access**: **Anyone** (required for the form to call it from the web)
4. Click **Deploy**
5. Approve the permissions when prompted (first-time only)
6. **Copy the Web app URL** — you will need it for the frontend  
   It looks like: `https://script.google.com/macros/s/.../exec`

---

## Part 2: Frontend (Static Hosting)

### Step 2.1: Update script.js

1. Open `script.js`
2. Find these lines at the top:
   ```javascript
   const API_URL = 'YOUR_WEB_APP_URL';
   const API_TOKEN = 'YOUR_SECRET_TOKEN';
   ```
3. Replace:
   - `YOUR_WEB_APP_URL` with the Web app URL from Part 1, Step 1.4
   - `YOUR_SECRET_TOKEN` with the **same** secret token you set in `Code.gs`

### Step 2.2: Upload to GitHub Pages

1. Create a new GitHub repository (or use an existing one)
2. Upload these files to the repository root:
   - `index.html`
   - `style.css`
   - `script.js`
3. Go to **Settings** > **Pages**
4. Under "Build and deployment", set:
   - **Source**: Deploy from a branch
   - **Branch**: main (or master) / root
5. Click **Save**
6. After a minute, your form will be live at:  
   `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/`

### Alternative: Netlify

1. Go to [netlify.com](https://www.netlify.com) and sign in
2. Drag and drop the folder containing `index.html`, `style.css`, and `script.js` onto the Netlify deploy area
3. Netlify will give you a live URL (e.g. `https://random-name.netlify.app`)

---

## Part 3: Google Sheet Setup

Your sheet must have these columns **in this exact order** (row 1 = headers):

| Column | Example |
|--------|---------|
| Timestamp | (auto-filled) |
| Chatwoot Id | 12345 |
| Order Type | Walk-in, Instagram, etc. |
| **Delivery or Pickup** | Delivery, Pickup |
| Product | Rose bouquet |
| Quantity | 2 |
| Order Date | 2024-02-25 |
| Requested Date | 2024-02-26 |
| Customer Name | John Doe |
| Email | john@example.com |
| Contact Number | 0501234567 |
| Delivery Address | 123 Main St |
| Area | Rawabi, Malaz, Olaya, Other |
| Invoice No | INV-123 or (auto) |
| Order Total | 200.00 |
| Amount Paid | 100.00 |

**Optional**: Add a "Balance Due" column with formula `=Order Total - Amount Paid` to see what's still owed.

**If your sheet already has data**: Replace "Total Paid" with "Order Total" and "Amount Paid" (two columns). Add "Delivery or Pickup" after "Order Type" if not already present.

---

## Part 4: Production Checklist

- [ ] Google Sheet has "Delivery or Pickup" after "Order Type" and "Order Total" + "Amount Paid" instead of "Total Paid"
- [ ] Google Apps Script deployed with correct `SPREADSHEET_ID` and `SECRET_TOKEN`
- [ ] Code.gs updated and redeployed (if you had a previous version)
- [ ] Frontend `script.js` has `API_URL` and `API_TOKEN` set
- [ ] Form is hosted and accessible (GitHub Pages or Netlify)
- [ ] Test: Fill the form, click Save, confirm a new row appears in the Google Sheet
- [ ] Share the form URL with employees

---

## Security Notes

- **Token**: The `SECRET_TOKEN` is sent in the request body. If you host on a public GitHub repo, anyone can see it in `script.js`. For production, consider:
  - Using a private repo, or
  - Hosting on Netlify and using environment variables (would require a small build step), or
  - Keeping the token simple and changing it if you suspect misuse
- **Permissions**: The Web app runs as "Me" and writes to your spreadsheet. Only people with the form URL can submit — they still need the correct token (which is embedded in your hosted JS).

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Unauthorized" after submit | Ensure `API_TOKEN` in script.js matches `SECRET_TOKEN` in Code.gs |
| "No data received" | Check that the form is sending JSON; ensure `API_URL` ends with `/exec` |
| Rows not appearing in sheet | Verify `SPREADSHEET_ID` is correct and matches the target sheet |
| CORS error | Use "Execute as: Me" and "Who has access: Anyone" when deploying the Web app |
| Form shows "API URL is not configured" | Update `API_URL` and `API_TOKEN` in script.js before deploying |
