; Errata curated distribution — Windows install identity.
; Keep the display name "Errata", but choose a distinct default installation directory so
; an existing upstream/Viscerous Errata installation is not overwritten by this distribution.

!macro preInit
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "$LOCALAPPDATA\Programs\Mr-Ken-1102\Errata"
!macroend
