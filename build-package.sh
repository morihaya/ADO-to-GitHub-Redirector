#!/bin/bash

# ADO to GitHub Redirector - Chrome Web Store Package Builder
# This script creates a clean zip file for Chrome Web Store submission

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 ADO to GitHub Redirector - Package Builder${NC}"
echo -e "${BLUE}=============================================${NC}"

# Define required files for Chrome Web Store
REQUIRED_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "content.js"
    "background.js"
    "icon16.png"
    "icon32.png"
    "icon48.png"
    "icon128.png"
)

# Check if all required files exist
echo -e "${YELLOW}📋 Checking required files...${NC}"
missing_files=()
for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo -e "  ✅ $file"
    else
        echo -e "  ❌ $file"
        missing_files+=("$file")
    fi
done

# Exit if any files are missing
if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Missing required files:${NC}"
    for file in "${missing_files[@]}"; do
        echo -e "   - $file"
    done
    echo -e "${RED}Please ensure all required files are present before packaging.${NC}"
    exit 1
fi

# Remove old package if it exists
PACKAGE_NAME="ado-to-github-redirector.zip"
if [[ -f "$PACKAGE_NAME" ]]; then
    echo -e "${YELLOW}🗑️  Removing existing package: $PACKAGE_NAME${NC}"
    rm "$PACKAGE_NAME"
fi

# Create the zip package
echo -e "${YELLOW}📦 Creating Chrome Web Store package...${NC}"
zip -r "$PACKAGE_NAME" "${REQUIRED_FILES[@]}" -x "*.git*" "*.DS_Store*" "*~*"

# Check if zip was created successfully
if [[ -f "$PACKAGE_NAME" ]]; then
    file_size=$(du -h "$PACKAGE_NAME" | cut -f1)
    echo -e "${GREEN}✅ Package created successfully!${NC}"
    echo -e "${GREEN}📁 File: $PACKAGE_NAME${NC}"
    echo -e "${GREEN}📏 Size: $file_size${NC}"
    
    # Show package contents
    echo -e "${BLUE}📋 Package contents:${NC}"
    unzip -l "$PACKAGE_NAME"
    
    echo -e "${GREEN}🚀 Ready for Chrome Web Store submission!${NC}"
    echo -e "${BLUE}Next steps:${NC}"
    echo -e "  1. Go to Chrome Web Store Developer Dashboard"
    echo -e "  2. Upload $PACKAGE_NAME"
    echo -e "  3. Fill in store listing details"
    echo -e "  4. Submit for review"
    
else
    echo -e "${RED}❌ Failed to create package!${NC}"
    exit 1
fi

echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}🎉 Package build completed successfully!${NC}"