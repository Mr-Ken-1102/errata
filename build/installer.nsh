; Errata curated distribution — Windows install identity.
; Keep the display name "Errata", but choose a distinct default installation directory so
; an existing upstream/Viscerous Errata installation is not overwritten by this distribution.
;
; Preserve an existing curated installation location on upgrades/reinstalls. electron-builder
; reads this value after preInit to recover the previous $INSTDIR, so overwriting it here would
; discard a custom directory selected by the user.

!macro preInit
  !ifndef BUILD_UNINSTALLER
    SetRegView 64
    ReadRegStr $0 HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
    ${If} $0 == ""
      SetRegView 32
      ReadRegStr $0 HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation
    ${EndIf}

    ${If} $0 == ""
      SetRegView 64
      WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\Programs\Mr-Ken-1102\Errata"
      SetRegView 32
      WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\Programs\Mr-Ken-1102\Errata"
    ${EndIf}

    ; The main installer will call check64BitAndSetRegView immediately after preInit. Restore
    ; the expected view here as well so this macro has no surprising state for future changes.
    SetRegView 64
  !endif
!macroend
