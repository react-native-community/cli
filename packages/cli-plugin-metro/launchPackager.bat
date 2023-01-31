@echo off
title Metro
call .packager.bat
cd %PROJECT_ROOT%
npx react-native start
pause
exit
