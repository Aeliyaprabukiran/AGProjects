@echo off
chcp 65001 > nul
cd c:\Users\aeliy\OneDrive\문서\AGProjects\multi-tool-dashboard
git init
git add .
git commit -m "Initial commit of 7yaTools Dashboard"
echo.
echo =========================================
echo Git repository initialized and committed.
echo To deploy to Vercel, please follow these steps:
echo 1. Create a free account at GitHub.com and make a new repository.
echo 2. Run the following commands here:
echo    git remote add origin ^<your-github-repo-url^>
echo    git branch -M main
echo    git push -u origin main
echo 3. Go to Vercel.com, connect your GitHub, and import the repository.
echo =========================================
pause
