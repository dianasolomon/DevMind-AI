@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM
@REM Required ENV vars:
@REM   JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars
@REM   MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the batch commands
@REM   MAVEN_BATCH_PAUSE - set to 'on' to wait for a keystroke before ending
@REM   MAVEN_OPTS - parameters passed to the Java VM when running Maven
@REM ----------------------------------------------------------------------------

@IF "%MAVEN_BATCH_ECHO%" == "on"  echo %MAVEN_BATCH_ECHO%

@REM set %HOME% to equivalent of $HOME
@IF "%HOME%" == "" (SET "HOME=%HOMEDRIVE%%HOMEPATH%")

@SET ERROR_CODE=0

@REM set local scope for the variables with windows NT shell
@SETLOCAL

SET MAVEN_PROJECTBASEDIR=%MAVEN_BASEDIR%
IF NOT "%MAVEN_PROJECTBASEDIR%" == "" GOTO endDetectBaseDir

SET EXEC_DIR=%CD%
SET WDIR=%EXEC_DIR%
:findBaseDir
IF EXIST "%WDIR%"\.mvn GOTO baseDirFound
cd ..
IF "%WDIR%"=="%CD%" GOTO baseDirNotFound
SET WDIR=%CD%
GOTO findBaseDir

:baseDirFound
SET MAVEN_PROJECTBASEDIR=%WDIR%
cd "%EXEC_DIR%"
GOTO endDetectBaseDir

:baseDirNotFound
SET MAVEN_PROJECTBASEDIR=%EXEC_DIR%
cd "%EXEC_DIR%"

:endDetectBaseDir

@REM Find the project base dir, i.e. the directory that contains the folder ".mvn".
@REM Fallback to current directory if not found.

SET WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
SET WRAPPER_LAUNCHER=org.apache.maven.wrapper.MavenWrapperMain

SET WRAPPER_URL="https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar"

FOR /F "usebackq tokens=1,2 delims==" %%A IN ("%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties") DO (
    IF "%%A"=="wrapperUrl" SET WRAPPER_URL=%%B
)

@REM Find the user home directory
IF NOT "%MAVEN_USER_HOME%" == "" GOTO endDetectMavenUserHome
SET MAVEN_USER_HOME=%USERPROFILE%\.m2
:endDetectMavenUserHome

IF EXIST %WRAPPER_JAR% (
    SET MVNW_REPOURL=
) ELSE (
    @REM Download the maven-wrapper.jar
    IF NOT "%MVNW_REPOURL%" == "" GOTO skipDownload
    SET MVNW_REPOURL=https://repo.maven.apache.org/maven2
    :skipDownload

    @REM If specified, validate the SHA-256 sum of the Maven wrapper jar file
    SET MVNW_VERBOSE=false
    IF NOT "%MVNW_VERBOSE%" == "false" (
        ECHO Downloading from: %WRAPPER_URL%
    )

    powershell -Command "&{"^
		"$webclient = new-object System.Net.WebClient;"^
		"if (-not ([string]::IsNullOrEmpty('%MVNW_USERNAME%') -and [string]::IsNullOrEmpty('%MVNW_PASSWORD%'))) {"^
		"$webclient.Credentials = new-object System.Net.NetworkCredential('%MVNW_USERNAME%', '%MVNW_PASSWORD%');"^
		"}"^
		"[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $webclient.DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')"^
		"}"
    IF "%ERRORLEVEL%"=="0" GOTO :downloadSucceeded
    ECHO Failed to download Maven wrapper from: %WRAPPER_URL%
    EXIT /B 1
    :downloadSucceeded
)

@REM Determine the Java command to use to start the JVM.
SET JAVA_EXE=java
IF NOT "%JAVA_HOME%" == "" (
    IF EXIST "%JAVA_HOME%\bin\java.exe" (
        SET "JAVA_EXE=%JAVA_HOME%\bin\java.exe"
    )
)

%JAVA_EXE% -classpath %WRAPPER_JAR% "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" %WRAPPER_LAUNCHER% %MAVEN_CONFIG% %*
IF ERRORLEVEL 1 GOTO :error
GOTO :end

:error
SET ERROR_CODE=1

:end
@ENDLOCAL & SET ERROR_CODE=%ERROR_CODE%

IF NOT "%MAVEN_BATCH_PAUSE%" == "on" GOTO end2
ECHO Pausing, press any key to continue or Ctrl+C to cancel...
PAUSE

:end2
IF "%MAVEN_TERMINATE_CMD%" == "on" EXIT %ERROR_CODE%

EXIT /B %ERROR_CODE%
