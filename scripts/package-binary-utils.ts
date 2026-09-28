export function binaryPatternForPlatform(platform: NodeJS.Platform): RegExp {
  return platform === 'win32'
    ? /^errata(?:-\d+)?\.exe$/i
    : /^errata(?:-\d+)?$/i
}

export function executablePrefixForPlatform(platform: NodeJS.Platform): string {
  return platform === 'win32' ? '.\\' : './'
}

export function runInstructionsForPlatform(
  platform: NodeJS.Platform,
  binaryName: string,
): string[] {
  const prefix = executablePrefixForPlatform(platform)
  return platform === 'win32'
    ? [`  ${prefix}${binaryName}`]
    : [`  chmod +x ${binaryName}`, `  ${prefix}${binaryName}`]
}
