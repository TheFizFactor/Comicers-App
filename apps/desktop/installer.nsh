!macro customInstall
  ; Add repair option
  ${GetParameters} $R0
  ${GetOptions} $R0 "/repair" $R1
  ${IfNot} ${Errors}
    SetDetailsPrint both
    DetailPrint "Starting repair..."
    
    ; Remove existing files except user data
    RMDir /r "$INSTDIR\resources"
    RMDir /r "$INSTDIR\locales"
    Delete "$INSTDIR\*.dll"
    Delete "$INSTDIR\*.exe"
    Delete "$INSTDIR\*.pak"
    Delete "$INSTDIR\*.dat"
    
    ; Continue with normal installation
    SetDetailsPrint none
  ${EndIf}
!macroend

!macro customUnInstall
  ; Clean up user data (optional)
  MessageBox MB_YESNO "Would you like to remove all user data and settings?" IDNO SkipDataRemoval
    RMDir /r "$LOCALAPPDATA\Comicers"
  SkipDataRemoval:
!macroend 