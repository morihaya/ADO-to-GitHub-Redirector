#!/bin/bash
# Extension build script for Chrome Web Store and Edge Addons

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EXTENSION_NAME="ado-to-github-redirector"
BUILD_DIR="build"
DIST_DIR="dist"
VERSION=$(node -p "require('./manifest.json').version" 2>/dev/null || echo "1.0.0")

echo -e "${BLUE}🔧 ADO to GitHub Redirector - Extension Builder${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Building extension: ${GREEN}$EXTENSION_NAME v$VERSION${NC}"

# Define required files for Chrome Web Store
REQUIRED_FILES=(
    "manifest.json"
    "popup.html"
    "popup.js"
    "content.js"
    "background.js"
    "shared.js"
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

if [[ ${#missing_files[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Missing required files:${NC}"
    for file in "${missing_files[@]}"; do
        echo -e "   - $file"
    done
    echo -e "${RED}Please ensure all required files are present before building.${NC}"
    exit 1
fi

# Clean previous builds
echo -e "${YELLOW}🗑️  Cleaning previous builds...${NC}"
rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$BUILD_DIR" "$DIST_DIR"

# Copy required files to build directory
echo -e "${YELLOW}📂 Copying files to build directory...${NC}"
for file in "${REQUIRED_FILES[@]}"; do
    cp "$file" "$BUILD_DIR/"
done

# Remove development artifacts from build directory
echo -e "${YELLOW}🧹 Removing development files...${NC}"
find "$BUILD_DIR" -name ".git*" -delete 2>/dev/null || true
find "$BUILD_DIR" -name ".DS_Store" -delete 2>/dev/null || true

# Create ZIP for Chrome Web Store
echo -e "${YELLOW}📦 Creating Chrome Web Store package...${NC}"
cd "$BUILD_DIR"
zip -r "../$DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip" .
cd ..

# Create ZIP for Edge Addons (same package as Chrome)
echo -e "${YELLOW}📦 Creating Edge Addons package...${NC}"
cp "$DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip" "$DIST_DIR/${EXTENSION_NAME}-edge-v${VERSION}.zip"

# Display results
echo ""
echo -e "${GREEN}✅ Build completed!${NC}"
echo -e "${GREEN}📁 Chrome Web Store: $DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip${NC}"
echo -e "${GREEN}📁 Edge Addons:      $DIST_DIR/${EXTENSION_NAME}-edge-v${VERSION}.zip${NC}"

CHROME_SIZE=$(du -h "$DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip" | cut -f1)
echo -e "${GREEN}📏 Size: $CHROME_SIZE${NC}"

echo -e "${BLUE}📋 Package contents:${NC}"
unzip -l "$DIST_DIR/${EXTENSION_NAME}-chrome-v${VERSION}.zip"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Next steps:${NC}"
echo -e "  Chrome: Upload to https://chrome.google.com/webstore/devconsole"
echo -e "  Edge:   Upload to https://partner.microsoft.com/en-us/dashboard/microsoftedge"
echo -e "${GREEN}🎉 Ready for store submission!${NC}"
