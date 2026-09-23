import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AppLanguage = 'en' | 'vi'

export const DEFAULT_LANGUAGE: AppLanguage = 'en'
export const LANGUAGE_STORAGE_KEY = 'errata-language'

interface LanguageStorageReader {
  getItem: (key: string) => string | null
}

interface LanguageStorageWriter {
  setItem: (key: string, value: string) => void
}

const EN_MESSAGES = {
  'app.name': 'Errata',
  'settings.language.heading': 'Language',
  'settings.language.label': 'Interface language',
  'settings.language.description': 'Changes Errata interface text only. Story content and generation language are unchanged.',
  'settings.language.english': 'English',
  'settings.language.vietnamese': 'Tiếng Việt',
  'settings.about.heading': 'About',
  'settings.about.tagline': 'LLM-assisted writing, built around a fragment system.',
  'settings.about.documentation': 'Documentation',
  'settings.about.discord': 'Discord community',
  'settings.about.github': 'GitHub repository',
  'settings.about.releases': 'Releases and changelog',
  'settings.about.builtBy': 'Built by',
  'settings.dialog.title': 'Settings',
  'settings.dialog.close': 'Close',
  'settings.dialog.closeSettings': 'Close settings',
  'settings.dialog.sections': 'Settings sections',
  'settings.toc.appearance': 'Appearance',
  'settings.toc.typography': 'Typography',
  'settings.toc.readAloud': 'Read aloud',
  'settings.toc.providers': 'Providers',
  'settings.toc.generation': 'Generation',
  'settings.toc.authoring': 'Authoring',
  'settings.toc.remote': 'Remote',
  'settings.toc.erratanet': 'ErrataNet',
  'settings.toc.updates': 'Updates',
  'settings.toc.plugins': 'Plugins',
  'settings.toc.about': 'About',
  'settings.group.interface': 'Interface',
  'settings.group.writing': 'Writing',
  'settings.group.system': 'System',
  'settings.tts.heading': 'Read aloud',
  'settings.tts.enable': 'Enable read-aloud',
  'settings.tts.enableDescription': 'Adds a Read aloud action to each passage and a player at the bottom of the screen.',
  'settings.tts.toggle': 'Toggle read-aloud',
  'settings.tts.engine': 'Engine',
  'settings.tts.engineDescription': 'Browser is instant. Supertonic is a far better neural voice (downloads ~200 MB on first use, then cached).',
  'settings.tts.browser': 'Browser',
  'settings.tts.supertonic': 'Supertonic',
  'settings.tts.voice': 'Voice',
  'settings.tts.browserVoiceDescription': 'System voices from your browser',
  'settings.tts.noBrowserVoiceDescription': 'No speech voices available in this browser',
  'settings.tts.defaultVoice': 'Default',
  'settings.tts.supertonicVoiceDescription': 'Supertonic preset voices, generated on-device.',
  'settings.tts.model': 'Model',
  'settings.tts.modelDescription': 'Downloads once on first read (~200 MB), then runs offline from cache.',
  'settings.tts.loading': 'Loading…',
  'settings.tts.ready': 'Ready',
  'settings.tts.preload': 'Preload',
  'settings.tts.quality': 'Quality',
  'settings.tts.steps': 'steps',
  'settings.tts.speed': 'Speed',
  'settings.tts.pitch': 'Pitch',
  'settings.tts.volume': 'Volume',
  'settings.tts.testVoice': 'Test voice',
  'settings.updates.heading': 'Updates',
  'settings.updates.installedVersion': 'Installed version',
  'settings.updates.nextVersion': 'Next version',
  'settings.updates.desktopUpdates': 'Desktop updates',
  'settings.updates.changelog': 'Changelog',
  'settings.updates.checkForUpdates': 'Check for updates',
  'settings.updates.downloadAndInstall': 'Download and install',
  'settings.updates.skip': 'Skip',
  'settings.updates.download': 'Download',
  'settings.updates.restartAndInstall': 'Restart and install',
  'settings.updates.updateNoun': 'update',
  'settings.updates.unknownError': 'unknown error',
  'settings.updates.status.checking': 'Checking for updates...',
  'settings.updates.status.available': 'Version {version} is available.',
  'settings.updates.status.downloading': 'Downloading {version}... {percent}%',
  'settings.updates.status.downloaded': 'Version {version} is ready to install.',
  'settings.updates.status.skipped': 'Version {version} skipped.',
  'settings.updates.status.latest': 'You are on the latest version.',
  'settings.updates.status.error': 'Update check failed: {error}',
  'settings.updates.status.idle': 'Check manually when you want to look for a new release.',
  'settings.updates.next.checking': 'Checking...',
  'settings.updates.next.none': 'None available',
  'settings.updates.next.checkToLoad': 'Check to load',
  'settings.updates.changelog.none': 'No changelog was included with this update.',
  'settings.updates.changelog.checking': 'Checking release metadata...',
  'settings.updates.changelog.idle': 'Run a manual update check to load the latest release notes.',
  'settings.updates.backupNotice': 'Errata only checks for updates when you click the button. Your stories are backed up before every install.',
  'settings.appearance.heading': 'Appearance',
  'settings.appearance.theme': 'Theme',
  'settings.appearance.light': 'Light',
  'settings.appearance.dark': 'Dark',
  'settings.appearance.highContrast': 'High',
  'settings.appearance.interactionSounds': 'Interaction sounds',
  'settings.appearance.interactionSoundsDescription': 'Play subtle feedback for controls',
  'settings.appearance.toggleInteractionSounds': 'Toggle interaction sounds',
  'settings.appearance.uiSize': 'UI size',
  'settings.appearance.uiSizeDescription': 'Scale the entire interface',
  'settings.appearance.quickSwitch': 'Quick switch',
  'settings.appearance.quickSwitchDescription': 'Show chevrons to swap between variations',
  'settings.appearance.toggleQuickSwitch': 'Toggle quick switch',
  'settings.appearance.mentions': 'Mentions',
  'settings.appearance.mentionsDescription': 'Highlight analyzed fragment references in prose',
  'settings.appearance.timelineBar': 'Timeline bar',
  'settings.appearance.timelineBarDescription': 'Show timeline switcher above prose',
  'settings.appearance.toggleTimelineBar': 'Toggle timeline bar',
  'settings.appearance.proseWidth': 'Prose width',
  'settings.appearance.proseWidthDescription': 'Reading column width',
  'settings.appearance.widthNarrow': 'Narrow',
  'settings.appearance.widthMedium': 'Medium',
  'settings.appearance.widthWide': 'Wide',
  'settings.appearance.widthFull': 'Full',
  'settings.appearance.fontSize': 'Font size',
  'settings.appearance.fontSizeDescription': 'Prose text size',
  'settings.appearance.customCss': 'Custom CSS',
  'settings.appearance.customCssDescription': 'Apply your own styles globally',
  'settings.appearance.toggleCustomCss': 'Toggle custom CSS',
  'settings.appearance.editCustomCss': 'Edit custom CSS',
  'settings.typography.heading': 'Typography',
  'settings.typography.reset': 'Reset',
  'settings.typography.display': 'Display',
  'settings.typography.displayDescription': 'Titles, headings, story names',
  'settings.typography.prose': 'Prose',
  'settings.typography.proseDescription': 'Reading experience, story content',
  'settings.typography.interface': 'Interface',
  'settings.typography.interfaceDescription': 'UI text, buttons, labels',
  'settings.typography.code': 'Code',
  'settings.typography.codeDescription': 'Fragment IDs, monospace text',
  'settings.typography.highVisibility': 'High visibility',
  'settings.providers.aboutModelConfiguration': 'About model configuration',
  'settings.providers.default': 'Default',
  'settings.providers.inherit': 'Inherit',
  'settings.providers.temperatureShort': 'Temp',
  'settings.providers.temperatureDescription': 'Temperature (0–2). Leave empty to use provider default.',
  'settings.providers.manageProviders': 'Manage providers',
  'settings.generation.heading': 'Generation',
  'settings.generation.workflow': 'Workflow',
  'settings.generation.workflowDescription': 'How prose generation runs and what the model is allowed to do.',
  'settings.generation.mode': 'Generation mode',
  'settings.generation.modeDescription': 'How prose generation is handled',
  'settings.generation.standard': 'Standard',
  'settings.generation.prewriter': 'Prewriter',
  'settings.generation.prewriterReasoning': 'Prewriter reasoning',
  'settings.generation.prewriterReasoningDescription': 'How much the prewriter deliberates. Short favors speed; Extensive favors depth.',
  'settings.generation.reasoningShort': 'Short',
  'settings.generation.reasoningNormal': 'Normal',
  'settings.generation.reasoningExtensive': 'Extensive',
  'settings.generation.clarifyBeforeWriting': 'Clarify before writing',
  'settings.generation.clarifyBeforeWritingDescription': 'Let the prewriter ask you questions when your direction is ambiguous, before it writes.',
  'settings.generation.toggleClarifyBeforeWriting': 'Toggle clarify before writing',
  'settings.generation.outputFormat': 'Output format',
  'settings.generation.plain': 'Plain',
  'settings.generation.markdown': 'Markdown',
  'settings.generation.maxSteps': 'Max steps',
  'settings.generation.maxStepsDescription': 'Tool-use rounds per generation',
  'settings.generation.disableThinking': 'Disable thinking',
  'settings.generation.disableThinkingDescription': 'Suppress extended thinking / reasoning mode on models that support it',
  'settings.generation.toggleDisableThinking': 'Toggle disable thinking',
  'settings.generation.expandThinking': 'Expand thinking by default',
  'settings.generation.expandThinkingDescription': "Show the model's thinking expanded while it generates, instead of collapsed",
  'settings.generation.toggleExpandThinking': 'Toggle expand thinking by default',
  'settings.generation.context': 'Context',
  'settings.generation.contextDescription': 'How the prompt is assembled before generation starts.',
  'settings.generation.fragmentOrdering': 'Fragment ordering',
  'settings.generation.fragmentOrderingDescription': 'Grouped bundles fragments by type. Custom unlocks the Fragment Order panel for drag-and-drop sequencing.',
  'settings.generation.grouped': 'Grouped',
  'settings.generation.custom': 'Custom',
  'settings.generation.contextLimit': 'Context limit',
  'settings.generation.learnMore': 'Learn more',
  'settings.generation.contextLimitDescription': 'How much recent prose to include',
  'settings.generation.fragments': 'Fragments',
  'settings.generation.tokens': 'Tokens',
  'settings.generation.characters': 'Characters',
  'settings.generation.librarian': 'Librarian',
  'settings.generation.librarianDescription': 'What happens after prose is generated and the librarian follows up.',
  'settings.generation.disableAutoAnalysis': 'Disable auto analysis',
  'settings.generation.disableAutoAnalysisDescription': 'Do not run the librarian automatically after prose generation',
  'settings.generation.toggleDisableAutoAnalysis': 'Toggle disable auto analysis',
  'settings.generation.autoApplySuggestions': 'Auto-apply suggestions',
  'settings.generation.autoApplySuggestionsDescription': 'Apply evidence-backed fragment corrections and new reusable records automatically',
  'settings.generation.toggleAutoApplySuggestions': 'Toggle auto-apply suggestions',
  'settings.generation.disableAutomaticDirections': 'Disable automatic directions',
  'settings.generation.disableAutomaticDirectionsDescription': 'Skip directions during automatic Librarian analysis; manual suggestions remain available',
  'settings.generation.toggleAutomaticDirections': 'Toggle automatic directions',
  'settings.generation.disableSuggestions': 'Disable suggestions',
  'settings.generation.disableSuggestionsDescription': 'Skip fragment corrections and new-record suggestions during analysis',
  'settings.generation.toggleDisableSuggestions': 'Toggle disable suggestions',
  'settings.proseColors.heading': 'Prose colors',
  'settings.proseColors.dialogue': 'Dialogue',
  'settings.proseColors.dialogueDescription': 'Quoted speech wrapped in double quotes',
  'settings.proseColors.dialogueDefault': 'Muted blue',
  'settings.proseColors.narration': 'Narration',
  'settings.proseColors.narrationDescription': 'Base prose text color',
  'settings.proseColors.narrationDefault': 'Theme foreground',
  'settings.proseColors.emphasis': 'Emphasis',
  'settings.proseColors.emphasisDescription': 'Italic text outside of dialogue',
  'settings.proseColors.emphasisDefault': 'Inherits narration',
  'settings.proseColors.resetDefault': 'Reset to default',
  'settings.proseColors.default': 'Default',
  'settings.proseColors.resetAll': 'Reset all',
  'settings.proseColors.preview': 'Preview',
} as const

export type TranslationKey = keyof typeof EN_MESSAGES

const VI_MESSAGES: Partial<Record<TranslationKey, string>> = {
  'settings.language.heading': 'Ngôn ngữ',
  'settings.language.label': 'Ngôn ngữ giao diện',
  'settings.language.description': 'Chỉ thay đổi chữ trên giao diện Errata. Nội dung truyện và ngôn ngữ tạo văn bản không thay đổi.',
  'settings.language.english': 'English',
  'settings.language.vietnamese': 'Tiếng Việt',
  'settings.about.heading': 'Giới thiệu',
  'settings.about.tagline': 'Không gian viết có hỗ trợ LLM, được xây dựng quanh hệ thống fragment.',
  'settings.about.documentation': 'Tài liệu',
  'settings.about.discord': 'Cộng đồng Discord',
  'settings.about.github': 'Kho mã GitHub',
  'settings.about.releases': 'Bản phát hành và nhật ký thay đổi',
  'settings.about.builtBy': 'Được xây dựng bởi',
  'settings.dialog.title': 'Cài đặt',
  'settings.dialog.close': 'Đóng',
  'settings.dialog.closeSettings': 'Đóng cài đặt',
  'settings.dialog.sections': 'Các mục cài đặt',
  'settings.toc.appearance': 'Giao diện',
  'settings.toc.typography': 'Kiểu chữ',
  'settings.toc.readAloud': 'Đọc thành tiếng',
  'settings.toc.providers': 'Nhà cung cấp',
  'settings.toc.generation': 'Tạo nội dung',
  'settings.toc.authoring': 'Soạn thảo',
  'settings.toc.remote': 'Truy cập từ xa',
  'settings.toc.erratanet': 'ErrataNet',
  'settings.toc.updates': 'Cập nhật',
  'settings.toc.plugins': 'Tiện ích',
  'settings.toc.about': 'Giới thiệu',
  'settings.group.interface': 'Giao diện',
  'settings.group.writing': 'Viết',
  'settings.group.system': 'Hệ thống',
  'settings.tts.heading': 'Đọc thành tiếng',
  'settings.tts.enable': 'Bật đọc thành tiếng',
  'settings.tts.enableDescription': 'Thêm thao tác Đọc thành tiếng cho mỗi đoạn và trình phát ở cuối màn hình.',
  'settings.tts.toggle': 'Bật hoặc tắt đọc thành tiếng',
  'settings.tts.engine': 'Công cụ đọc',
  'settings.tts.engineDescription': 'Trình duyệt phản hồi ngay. Supertonic dùng giọng đọc neural chất lượng cao hơn (tải khoảng 200 MB ở lần dùng đầu, sau đó được lưu đệm).',
  'settings.tts.browser': 'Trình duyệt',
  'settings.tts.supertonic': 'Supertonic',
  'settings.tts.voice': 'Giọng đọc',
  'settings.tts.browserVoiceDescription': 'Các giọng hệ thống do trình duyệt cung cấp',
  'settings.tts.noBrowserVoiceDescription': 'Trình duyệt này không có giọng đọc khả dụng',
  'settings.tts.defaultVoice': 'Mặc định',
  'settings.tts.supertonicVoiceDescription': 'Các giọng cài sẵn của Supertonic, được tạo trực tiếp trên thiết bị.',
  'settings.tts.model': 'Mô hình',
  'settings.tts.modelDescription': 'Chỉ tải một lần ở lần đọc đầu tiên (~200 MB), sau đó chạy ngoại tuyến từ bộ nhớ đệm.',
  'settings.tts.loading': 'Đang tải…',
  'settings.tts.ready': 'Sẵn sàng',
  'settings.tts.preload': 'Tải trước',
  'settings.tts.quality': 'Chất lượng',
  'settings.tts.steps': 'bước',
  'settings.tts.speed': 'Tốc độ',
  'settings.tts.pitch': 'Cao độ',
  'settings.tts.volume': 'Âm lượng',
  'settings.tts.testVoice': 'Thử giọng đọc',
  'settings.updates.heading': 'Cập nhật',
  'settings.updates.installedVersion': 'Phiên bản đã cài',
  'settings.updates.nextVersion': 'Phiên bản tiếp theo',
  'settings.updates.desktopUpdates': 'Cập nhật ứng dụng máy tính',
  'settings.updates.changelog': 'Nhật ký thay đổi',
  'settings.updates.checkForUpdates': 'Kiểm tra cập nhật',
  'settings.updates.downloadAndInstall': 'Tải xuống và cài đặt',
  'settings.updates.skip': 'Bỏ qua',
  'settings.updates.download': 'Tải xuống',
  'settings.updates.restartAndInstall': 'Khởi động lại và cài đặt',
  'settings.updates.updateNoun': 'bản cập nhật',
  'settings.updates.unknownError': 'lỗi không xác định',
  'settings.updates.status.checking': 'Đang kiểm tra bản cập nhật...',
  'settings.updates.status.available': 'Đã có phiên bản {version}.',
  'settings.updates.status.downloading': 'Đang tải {version}... {percent}%',
  'settings.updates.status.downloaded': 'Phiên bản {version} đã sẵn sàng để cài đặt.',
  'settings.updates.status.skipped': 'Đã bỏ qua phiên bản {version}.',
  'settings.updates.status.latest': 'Bạn đang dùng phiên bản mới nhất.',
  'settings.updates.status.error': 'Kiểm tra cập nhật thất bại: {error}',
  'settings.updates.status.idle': 'Chỉ kiểm tra thủ công khi bạn muốn tìm bản phát hành mới.',
  'settings.updates.next.checking': 'Đang kiểm tra...',
  'settings.updates.next.none': 'Không có bản mới',
  'settings.updates.next.checkToLoad': 'Kiểm tra để tải thông tin',
  'settings.updates.changelog.none': 'Bản cập nhật này không kèm nhật ký thay đổi.',
  'settings.updates.changelog.checking': 'Đang kiểm tra thông tin bản phát hành...',
  'settings.updates.changelog.idle': 'Chạy kiểm tra cập nhật thủ công để tải ghi chú phát hành mới nhất.',
  'settings.updates.backupNotice': 'Errata chỉ kiểm tra cập nhật khi bạn bấm nút. Truyện của bạn được sao lưu trước mỗi lần cài đặt.',
  'settings.appearance.heading': 'Giao diện',
  'settings.appearance.theme': 'Chủ đề',
  'settings.appearance.light': 'Sáng',
  'settings.appearance.dark': 'Tối',
  'settings.appearance.highContrast': 'Tương phản cao',
  'settings.appearance.interactionSounds': 'Âm thanh tương tác',
  'settings.appearance.interactionSoundsDescription': 'Phát phản hồi âm thanh nhẹ cho các điều khiển',
  'settings.appearance.toggleInteractionSounds': 'Bật hoặc tắt âm thanh tương tác',
  'settings.appearance.uiSize': 'Kích thước giao diện',
  'settings.appearance.uiSizeDescription': 'Thu phóng toàn bộ giao diện',
  'settings.appearance.quickSwitch': 'Chuyển nhanh',
  'settings.appearance.quickSwitchDescription': 'Hiển thị mũi tên để chuyển giữa các biến thể',
  'settings.appearance.toggleQuickSwitch': 'Bật hoặc tắt chuyển nhanh',
  'settings.appearance.mentions': 'Tham chiếu',
  'settings.appearance.mentionsDescription': 'Làm nổi bật các tham chiếu fragment đã phân tích trong văn xuôi',
  'settings.appearance.timelineBar': 'Thanh dòng thời gian',
  'settings.appearance.timelineBarDescription': 'Hiển thị bộ chuyển dòng thời gian phía trên văn xuôi',
  'settings.appearance.toggleTimelineBar': 'Bật hoặc tắt thanh dòng thời gian',
  'settings.appearance.proseWidth': 'Độ rộng văn xuôi',
  'settings.appearance.proseWidthDescription': 'Độ rộng cột đọc',
  'settings.appearance.widthNarrow': 'Hẹp',
  'settings.appearance.widthMedium': 'Vừa',
  'settings.appearance.widthWide': 'Rộng',
  'settings.appearance.widthFull': 'Toàn chiều rộng',
  'settings.appearance.fontSize': 'Cỡ chữ',
  'settings.appearance.fontSizeDescription': 'Cỡ chữ văn xuôi',
  'settings.appearance.customCss': 'CSS tùy chỉnh',
  'settings.appearance.customCssDescription': 'Áp dụng kiểu CSS của riêng bạn trên toàn giao diện',
  'settings.appearance.toggleCustomCss': 'Bật hoặc tắt CSS tùy chỉnh',
  'settings.appearance.editCustomCss': 'Chỉnh sửa CSS tùy chỉnh',
  'settings.typography.heading': 'Kiểu chữ',
  'settings.typography.reset': 'Đặt lại',
  'settings.typography.display': 'Tiêu đề',
  'settings.typography.displayDescription': 'Tiêu đề, đề mục và tên truyện',
  'settings.typography.prose': 'Văn xuôi',
  'settings.typography.proseDescription': 'Trải nghiệm đọc và nội dung truyện',
  'settings.typography.interface': 'Giao diện',
  'settings.typography.interfaceDescription': 'Văn bản giao diện, nút và nhãn',
  'settings.typography.code': 'Mã',
  'settings.typography.codeDescription': 'ID fragment và văn bản monospace',
  'settings.typography.highVisibility': 'Khả năng đọc cao',
  'settings.providers.aboutModelConfiguration': 'Giới thiệu về cấu hình mô hình',
  'settings.providers.default': 'Mặc định',
  'settings.providers.inherit': 'Kế thừa',
  'settings.providers.temperatureShort': 'Nhiệt độ',
  'settings.providers.temperatureDescription': 'Temperature (0–2). Để trống để dùng giá trị mặc định của nhà cung cấp.',
  'settings.providers.manageProviders': 'Quản lý nhà cung cấp',
  'settings.generation.heading': 'Tạo nội dung',
  'settings.generation.workflow': 'Quy trình',
  'settings.generation.workflowDescription': 'Cách quá trình tạo văn xuôi vận hành và những gì mô hình được phép thực hiện.',
  'settings.generation.mode': 'Chế độ tạo nội dung',
  'settings.generation.modeDescription': 'Cách xử lý quá trình tạo văn xuôi',
  'settings.generation.standard': 'Tiêu chuẩn',
  'settings.generation.prewriter': 'Prewriter',
  'settings.generation.prewriterReasoning': 'Mức suy luận của Prewriter',
  'settings.generation.prewriterReasoningDescription': 'Mức độ Prewriter cân nhắc trước khi viết. Ngắn ưu tiên tốc độ; Chuyên sâu ưu tiên độ sâu.',
  'settings.generation.reasoningShort': 'Ngắn',
  'settings.generation.reasoningNormal': 'Bình thường',
  'settings.generation.reasoningExtensive': 'Chuyên sâu',
  'settings.generation.clarifyBeforeWriting': 'Làm rõ trước khi viết',
  'settings.generation.clarifyBeforeWritingDescription': 'Cho phép Prewriter hỏi lại khi hướng dẫn của bạn còn mơ hồ trước khi bắt đầu viết.',
  'settings.generation.toggleClarifyBeforeWriting': 'Bật hoặc tắt làm rõ trước khi viết',
  'settings.generation.outputFormat': 'Định dạng đầu ra',
  'settings.generation.plain': 'Văn bản thuần',
  'settings.generation.markdown': 'Markdown',
  'settings.generation.maxSteps': 'Số bước tối đa',
  'settings.generation.maxStepsDescription': 'Số vòng sử dụng công cụ cho mỗi lần tạo nội dung',
  'settings.generation.disableThinking': 'Tắt chế độ suy luận',
  'settings.generation.disableThinkingDescription': 'Tắt chế độ suy luận mở rộng trên các mô hình có hỗ trợ',
  'settings.generation.toggleDisableThinking': 'Bật hoặc tắt việc vô hiệu hóa suy luận',
  'settings.generation.expandThinking': 'Mở rộng phần suy luận mặc định',
  'settings.generation.expandThinkingDescription': 'Hiển thị phần suy luận của mô hình ở trạng thái mở rộng trong khi tạo nội dung thay vì thu gọn',
  'settings.generation.toggleExpandThinking': 'Bật hoặc tắt mở rộng phần suy luận mặc định',
  'settings.generation.context': 'Ngữ cảnh',
  'settings.generation.contextDescription': 'Cách prompt được lắp ráp trước khi bắt đầu tạo nội dung.',
  'settings.generation.fragmentOrdering': 'Thứ tự fragment',
  'settings.generation.fragmentOrderingDescription': 'Nhóm sẽ gom fragment theo loại. Tùy chỉnh mở khóa bảng Thứ tự Fragment để kéo thả sắp xếp.',
  'settings.generation.grouped': 'Theo nhóm',
  'settings.generation.custom': 'Tùy chỉnh',
  'settings.generation.contextLimit': 'Giới hạn ngữ cảnh',
  'settings.generation.learnMore': 'Tìm hiểu thêm',
  'settings.generation.contextLimitDescription': 'Lượng văn xuôi gần đây được đưa vào ngữ cảnh',
  'settings.generation.fragments': 'Fragment',
  'settings.generation.tokens': 'Token',
  'settings.generation.characters': 'Ký tự',
  'settings.generation.librarian': 'Librarian',
  'settings.generation.librarianDescription': 'Những gì xảy ra sau khi văn xuôi được tạo và Librarian xử lý tiếp.',
  'settings.generation.disableAutoAnalysis': 'Tắt phân tích tự động',
  'settings.generation.disableAutoAnalysisDescription': 'Không tự động chạy Librarian sau khi tạo văn xuôi',
  'settings.generation.toggleDisableAutoAnalysis': 'Bật hoặc tắt việc vô hiệu hóa phân tích tự động',
  'settings.generation.autoApplySuggestions': 'Tự động áp dụng đề xuất',
  'settings.generation.autoApplySuggestionsDescription': 'Tự động áp dụng các chỉnh sửa fragment có bằng chứng và các bản ghi tái sử dụng mới',
  'settings.generation.toggleAutoApplySuggestions': 'Bật hoặc tắt tự động áp dụng đề xuất',
  'settings.generation.disableAutomaticDirections': 'Tắt hướng đi tự động',
  'settings.generation.disableAutomaticDirectionsDescription': 'Bỏ qua hướng đi trong phân tích Librarian tự động; đề xuất thủ công vẫn khả dụng',
  'settings.generation.toggleAutomaticDirections': 'Bật hoặc tắt hướng đi tự động',
  'settings.generation.disableSuggestions': 'Tắt đề xuất',
  'settings.generation.disableSuggestionsDescription': 'Bỏ qua chỉnh sửa fragment và đề xuất bản ghi mới trong quá trình phân tích',
  'settings.generation.toggleDisableSuggestions': 'Bật hoặc tắt việc vô hiệu hóa đề xuất',
  'settings.proseColors.heading': 'Màu văn bản',
  'settings.proseColors.dialogue': 'Hội thoại',
  'settings.proseColors.dialogueDescription': 'Lời thoại được đặt trong dấu ngoặc kép',
  'settings.proseColors.dialogueDefault': 'Xanh lam dịu',
  'settings.proseColors.narration': 'Trần thuật',
  'settings.proseColors.narrationDescription': 'Màu cơ bản của phần văn xuôi',
  'settings.proseColors.narrationDefault': 'Màu chữ của chủ đề',
  'settings.proseColors.emphasis': 'Nhấn mạnh',
  'settings.proseColors.emphasisDescription': 'Chữ nghiêng nằm ngoài hội thoại',
  'settings.proseColors.emphasisDefault': 'Kế thừa màu trần thuật',
  'settings.proseColors.resetDefault': 'Đặt lại về mặc định',
  'settings.proseColors.default': 'Mặc định',
  'settings.proseColors.resetAll': 'Đặt lại tất cả',
  'settings.proseColors.preview': 'Xem trước',
}

const SETTINGS_NAV_KEYS: Record<string, TranslationKey> = {
  Appearance: 'settings.toc.appearance',
  Typography: 'settings.toc.typography',
  'Read aloud': 'settings.toc.readAloud',
  Providers: 'settings.toc.providers',
  Generation: 'settings.toc.generation',
  Authoring: 'settings.toc.authoring',
  Remote: 'settings.toc.remote',
  ErrataNet: 'settings.toc.erratanet',
  Updates: 'settings.toc.updates',
  Plugins: 'settings.toc.plugins',
  About: 'settings.toc.about',
  Interface: 'settings.group.interface',
  Writing: 'settings.group.writing',
  System: 'settings.group.system',
}

export function normalizeLanguage(value: string | null | undefined): AppLanguage {
  return value === 'vi' ? 'vi' : DEFAULT_LANGUAGE
}

export function readLanguagePreference(storage?: LanguageStorageReader | null): AppLanguage {
  if (!storage) return DEFAULT_LANGUAGE
  try {
    return normalizeLanguage(storage.getItem(LANGUAGE_STORAGE_KEY))
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function persistLanguagePreference(
  language: AppLanguage,
  storage?: LanguageStorageWriter | null,
): void {
  if (!storage) return
  try {
    storage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Preference persistence is best-effort. The active session can still switch language.
  }
}

export function translate(language: AppLanguage, key: TranslationKey): string {
  if (language === 'vi') return VI_MESSAGES[key] ?? EN_MESSAGES[key]
  return EN_MESSAGES[key]
}

export function translateSettingsNavigation(language: AppLanguage, value: string): string {
  const key = SETTINGS_NAV_KEYS[value]
  return key ? translate(language, key) : value
}

interface LanguageContextValue {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Start from English on both server and client to keep hydration deterministic.
  // The saved preference is applied immediately after mount, and a boot script in
  // __root.tsx sets <html lang> before hydration.
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = readLanguagePreference(window.localStorage)
    setLanguageState(saved)

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== LANGUAGE_STORAGE_KEY) return
      setLanguageState(normalizeLanguage(event.newValue))
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next)
    if (typeof window !== 'undefined') {
      persistLanguagePreference(next, window.localStorage)
    }
  }, [])

  const t = useCallback((key: TranslationKey) => translate(language, key), [language])
  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}