import type { ReactNode } from 'react'
import { HELP_SECTIONS, type HelpSection } from './help-content'

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-border/40 bg-muted/40 text-[0.625rem] font-mono font-medium text-foreground/60 leading-none">
      {children}
    </kbd>
  )
}

function ToolCard({ name, description }: { name: string; description: string }) {
  return (
    <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2.5 mb-2 last:mb-0">
      <code className="text-[0.71875rem] font-mono font-medium text-primary/80">{name}</code>
      <p className="text-[0.71875rem] text-muted-foreground mt-0.5 leading-snug">{description}</p>
    </div>
  )
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <div className="border-l-2 border-primary/25 pl-3 py-1.5 my-2.5">
      <p className="text-[0.71875rem] text-foreground/55 leading-relaxed italic">{children}</p>
    </div>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p className="text-[0.78125rem] text-foreground/65 leading-relaxed mb-2.5 last:mb-0">{children}</p>
}

function Mono({ children }: { children: ReactNode }) {
  return <code className="text-[0.6875rem] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded">{children}</code>
}

const VI_GENERATION_SECTION: HelpSection = {
  id: 'generation',
  title: 'Tạo nội dung',
  description: 'Cách Errata tạo phần văn xuôi tiếp theo bằng fragment và các công cụ của mô hình.',
  subsections: [
    {
      id: 'overview',
      title: 'Cách hoạt động',
      content: (
        <>
          <P>
            Khi bạn tạo nội dung, Errata lắp ráp ngữ cảnh truyện — lịch sử văn xuôi, các fragment được ghim
            và các dòng danh mục — thành một prompt, rồi stream phần viết tiếp từ mô hình.
          </P>
          <P>
            Quy trình diễn ra như sau: hướng dẫn của tác giả được kết hợp với ngữ cảnh truyện,
            các hook của plugin chạy nếu có, mô hình tạo văn bản bằng những công cụ được phép dùng,
            rồi đầu ra được stream về cho bạn theo thời gian thực.
          </P>
          <Tip>
            Mô hình thấy toàn bộ nội dung của fragment được ghim, còn fragment không ghim chỉ xuất hiện
            dưới dạng một dòng trong danh mục. Dùng tùy chọn <Mono>sticky</Mono> trên fragment để kiểm soát
            nội dung mà mô hình luôn nhìn thấy.
          </Tip>
        </>
      ),
    },
    {
      id: 'context-building',
      title: 'Xây dựng ngữ cảnh',
      content: (
        <>
          <P>
            Khi bạn nhấn Tạo nội dung, Errata lắp ráp prompt từ các fragment của truyện rồi gửi đến mô hình.
            Quy trình này diễn ra theo một thứ tự cụ thể; hiểu thứ tự đó giúp bạn kiểm soát mô hình nhìn thấy
            gì và viết như thế nào.
          </P>
          <div className="mt-3 mb-3">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Quy trình</p>
            <div className="space-y-1.5">
              {[
                ['1', 'Tải fragment', 'Tất cả fragment được tải và sắp theo loại — văn xuôi, hướng dẫn, nhân vật, kiến thức.'],
                ['2', 'Áp dụng giới hạn ngữ cảnh', 'Văn xuôi gần đây được chọn từ chuỗi dựa trên cài đặt Giới hạn ngữ cảnh (số fragment, ngân sách token hoặc ngân sách ký tự).'],
                ['3', 'Tách sticky / non-sticky', 'Fragment sticky được đưa vào đầy đủ. Fragment non-sticky trở thành các dòng danh mục một dòng (ID, tên, mô tả).'],
                ['4', 'Hook plugin beforeContext', 'Plugin đang bật có thể thay đổi trạng thái ngữ cảnh — thêm, loại bỏ hoặc sắp xếp lại fragment trước khi render.'],
                ['5', 'Lắp ráp message', 'Mọi thứ được render thành một system message và một user message.'],
                ['6', 'Hook plugin beforeGeneration', 'Plugin có cơ hội cuối để thay đổi các message đã lắp ráp trước khi chúng được gửi đi.'],
                ['7', 'Stream tới mô hình', 'Prompt được gửi đi. Mô hình có thể gọi công cụ (nếu bật) để tra cứu fragment rồi viết văn xuôi.'],
                ['8', 'Lưu và phân tích', 'Đầu ra được lưu thành fragment văn xuôi mới, các hook afterGeneration/afterSave chạy và Librarian được kích hoạt.'],
              ].map(([num, label, desc]) => (
                <div key={num} className="flex gap-2.5 items-start">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-foreground/8 text-[0.5625rem] font-mono font-bold text-foreground/40 flex items-center justify-center mt-0.5">{num}</span>
                  <div className="min-w-0">
                    <span className="text-[0.75rem] font-medium text-foreground/70">{label}</span>
                    <p className="text-[0.6875rem] text-muted-foreground leading-snug">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Mô hình nhìn thấy gì</p>
          </div>
          <P>
            Prompt cuối gồm hai message. <strong className="text-foreground/75">system message</strong> chứa
            hướng dẫn viết, danh sách công cụ khả dụng và mọi fragment sticky được đặt ở vị trí <Mono>system</Mono>.
            <strong className="text-foreground/75"> user message</strong> chứa theo thứ tự:
          </P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-0.5">
            {[
              'Tên và mô tả truyện',
              'Bộ nhớ truyện liên kết nguồn (khi có văn xuôi cũ đã được phân tích)',
              'Fragment sticky do người dùng đặt — toàn bộ nội dung',
              'Các dòng danh mục non-sticky — một dòng cho mỗi fragment',
              'Văn xuôi gần đây từ chuỗi (theo giới hạn ngữ cảnh)',
              'Hướng dẫn hiện tại của tác giả',
            ].map((item, i) => (
              <p key={item} className="text-[0.71875rem] text-foreground/55 leading-snug">
                <span className="text-muted-foreground mr-1.5">{i + 1}.</span>{item}
              </p>
            ))}
          </div>
          <Tip>
            Dùng bảng Debug để xem chính xác dữ liệu đã được gửi trong bất kỳ lần tạo nội dung nào;
            tab Prompt hiển thị đầy đủ cả hai message.
          </Tip>
        </>
      ),
    },
    {
      id: 'built-in-tools',
      title: 'Công cụ tích hợp',
      content: (
        <>
          <P>
            Mô hình có thể gọi công cụ trong lúc tạo nội dung để tra cứu chi tiết fragment trước khi viết văn xuôi.
            Bạn có thể bật hoặc tắt từng công cụ trong <strong className="text-foreground/75">Cài đặt</strong>.
          </P>
          <div className="mt-3 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Công cụ đọc</p>
            <ToolCard name="readFragments(ids)" description="Đọc theo lô toàn bộ nội dung fragment và base hash trước khi dựa vào chi tiết hoặc đề xuất viết lại." />
            <ToolCard name="listFragments(filters)" description="Liệt kê tóm tắt fragment với bộ lọc tùy chọn theo type, query, archived và limit." />
            <ToolCard name="findFragments(query)" description="Tìm trong các trường của fragment và trả về ID, trường, đoạn trích cùng base hash phù hợp." />
            <ToolCard name="readProseChain()" description="Kiểm tra văn xuôi đang hoạt động theo đúng thứ tự, có thể kèm toàn bộ nội dung." />
            <ToolCard name="listFragmentTypes()" description="Liệt kê mọi loại fragment đã đăng ký cùng prefix và giá trị mặc định." />
            <ToolCard name="readStorySummary()" description="Đọc phép chiếu bộ nhớ truyện liên kết nguồn và mọi bản ghi authored memory." />
          </div>
          <div className="mt-4 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Công cụ chỉnh sửa (Librarian chat/refine)</p>
            <P>
              Các công cụ này có trong những luồng chỉnh sửa Librarian tường minh. Chúng áp dụng thay đổi theo kiểu nguyên tử
              và trả về diff để bạn có thể hoàn tác:
            </P>
            <ToolCard name="editFragments(operations)" description="Tạo theo lô, sửa chính xác, nối thêm, viết lại toàn trường hoặc lưu trữ fragment." />
            <ToolCard name="editProse(edits)" description="Quét văn xuôi đang hoạt động và áp dụng chỉnh sửa tìm/thay thế chính xác." />
          </div>
        </>
      ),
    },
    {
      id: 'output-format',
      title: 'Định dạng đầu ra',
      content: (
        <>
          <P>
            Chọn đầu ra <Mono>plaintext</Mono> hoặc <Mono>markdown</Mono> trong Cài đặt.
          </P>
          <P>
            <strong className="text-foreground/75">Văn bản thuần</strong> tạo văn xuôi sạch, không có ký hiệu định dạng.
            Phù hợp nhất với truyện văn học và cách kể chuyện đơn giản.
          </P>
          <P>
            <strong className="text-foreground/75">Markdown</strong> cho phép mô hình dùng nhấn mạnh,
            tiêu đề và các định dạng khác. Phù hợp với nội dung có cấu trúc hoặc truyện có các phần phân biệt rõ.
          </P>
        </>
      ),
    },
    {
      id: 'generation-mode',
      title: 'Chế độ tạo nội dung',
      content: (
        <>
          <P>
            Cài đặt <strong className="text-foreground/75">Chế độ tạo nội dung</strong> kiểm soát cách Errata
            chuẩn bị một lượt tạo văn xuôi trước khi mô hình Writer bắt đầu tạo văn bản.
          </P>
          <P>
            <strong className="text-foreground/75">Tiêu chuẩn</strong> gửi ngữ cảnh truyện đã lắp ráp
            và hướng dẫn của tác giả thẳng tới mô hình Writer.
          </P>
          <P>
            <strong className="text-foreground/75">Prewriter</strong> thêm một lượt lập kế hoạch trước.
            Một mô hình hỗ trợ có thể phác thảo brief, nhịp độ hoặc hướng đi trước lượt Writer cuối,
            giúp cấu trúc tốt hơn khi bạn muốn đầu ra được định hướng nhiều hơn.
          </P>
          <P>
            <strong className="text-foreground/75">Mức suy luận của Prewriter</strong> điều chỉnh thời gian
            dành cho lượt lập kế hoạch. <em>Ngắn</em> ưu tiên tốc độ — brief súc tích và ít bước dùng công cụ hơn.
            <em>Bình thường</em> cân bằng. <em>Chuyên sâu</em> ưu tiên chiều sâu — brief dài và kỹ hơn với phần xử lý
            nhân vật phong phú hơn. Chọn Ngắn nếu Prewriter làm bạn phải chờ quá lâu.
          </P>
          <P>
            Khi bật Prewriter, bạn cũng có thể bật <strong className="text-foreground/75">Làm rõ trước khi viết</strong>.
            Khi hướng dẫn còn mơ hồ, Prewriter sẽ tạm dừng để hỏi vài câu có mục tiêu — chọn phương án được đề xuất hoặc
            tự nhập câu trả lời — rồi đưa các câu trả lời vào brief trước khi viết văn xuôi. Nếu mọi thứ đã rõ,
            nó chuyển thẳng sang viết; bạn luôn có thể chọn <em>Bỏ qua và viết</em>. Câu trả lời chỉ hướng dẫn đoạn
            viết hiện tại và không được lưu lại.
          </P>
          <Tip>
            Dùng Tiêu chuẩn để viết tiếp trực tiếp. Dùng Prewriter khi muốn mô hình suy nghĩ về bước tiếp theo trước
            khi soạn văn xuôi; bật Làm rõ khi bạn muốn mô hình hỏi lại thay vì tự đoán sai.
          </Tip>
        </>
      ),
    },
    {
      id: 'max-steps',
      title: 'Số bước tối đa',
      content: (
        <>
          <P>
            Kiểm soát số vòng sử dụng công cụ mà mô hình có thể thực hiện trước khi buộc phải tạo đầu ra.
            Mặc định là 10 bước. Mỗi bước là một chu kỳ gọi công cụ + nhận kết quả.
          </P>
          <Tip>
            Nếu mô hình gọi quá nhiều công cụ trước khi viết, hãy giảm giá trị này.
            Nếu việc tra cứu bằng công cụ bị cắt quá sớm, hãy tăng nó.
          </Tip>
        </>
      ),
    },
    {
      id: 'disable-thinking',
      title: 'Tắt chế độ suy luận',
      content: (
        <>
          <P>
            Một số mô hình tương thích OpenAI hỗ trợ chế độ suy luận mở rộng. Khi bật
            <strong className="text-foreground/75"> Tắt chế độ suy luận</strong>, Errata yêu cầu các provider
            có hỗ trợ tắt chế độ đó.
          </P>
          <P>
            Việc này có thể giảm chi phí suy luận ẩn, khiến phản hồi trực tiếp hơn và giúp hành vi nhất quán hơn
            giữa các provider có cơ chế suy luận khác nhau.
          </P>
          <Tip>
            Bật tùy chọn này nếu mô hình quá chậm, quá tốn kém hoặc dùng quá nhiều suy luận nội bộ.
            Để tắt nếu bạn muốn giữ chế độ suy luận mặc định của provider.
          </Tip>
        </>
      ),
    },
    {
      id: 'summarization',
      title: 'Tóm tắt và bộ nhớ truyện',
      content: (
        <>
          <P>
            Giới hạn ngữ cảnh khiến văn xuôi cũ cuối cùng sẽ rời khỏi prompt. Cơ chế tóm tắt giúp giữ lại phần ngữ cảnh
            đã rời cửa sổ đó — đây là bộ nhớ dài hạn của mô hình.
          </P>
          <P>
            Sau mỗi lần tạo nội dung, Librarian đọc văn xuôi mới và viết một tóm tắt hồi cứu ngắn gắn với đúng revision
            văn xuôi đó. Khi văn xuôi cũ nằm ngoài cửa sổ ngữ cảnh thô, Errata tạo một phép chiếu bộ nhớ truyện có giới hạn
            từ các bản ghi vẫn còn đúng theo nguồn.
          </P>
          <P>
            Bộ nhớ không bao giờ được nối dồn vào một bản tóm tắt toàn cục có thể thay đổi. Chỉnh sửa văn xuôi, đổi variation
            hoặc tạo lại từ một điểm trước đó sẽ tự động thay đổi những bản ghi liên kết nguồn nào còn hợp lệ.
            Phân tích thiếu, lỗi thời hoặc thuộc contract cũ được hiển thị thành khoảng trống coverage rõ ràng thay vì âm thầm
            được coi là sự thật.
          </P>
          <P>
            Phép chiếu có ngân sách token cố định và luôn giữ các bản ghi gần ranh giới với văn xuôi gần đây nhất.
            Cách diễn đạt được điều chỉnh theo bên đọc — Writer, Directions, Librarian hoặc luồng chỉnh sửa —
            mà không cần thêm một lần gọi mô hình trên đường chạy foreground.
          </P>
          <Tip>
            Tóm tắt và giới hạn ngữ cảnh hoạt động theo cặp: giới hạn ngữ cảnh quyết định lượng văn xuôi thô mô hình nhìn thấy,
            còn bộ nhớ truyện đại diện cho văn xuôi đã phân tích trước cửa sổ đó. Hãy phân tích lại đoạn văn khi mục bộ nhớ
            báo khoảng trống stale hoặc missing.
          </Tip>
        </>
      ),
    },
    {
      id: 'authored-memory',
      title: 'Bộ nhớ do tác giả tạo',
      content: (
        <>
          <P>
            Summary fragment là các bản ghi authored memory tùy chọn. Librarian không tự viết hay compact chúng;
            hãy dùng khi bạn muốn nêu một sự kiện biên tập bền vững, tiền đề hoặc cách diễn giải cấp cao không được suy ra
            từ một đoạn văn xuôi cụ thể.
          </P>
          <P>Bản ghi do tác giả tạo được giữ tách khỏi lịch sử truyện suy ra tự động:</P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-0.5">
            {[
              'Authored memory: ngữ cảnh biên tập tường minh do bạn kiểm soát.',
              'Derived memory: bản ghi Librarian liên kết nguồn dành cho văn xuôi cũ.',
              'Recent prose: các fragment nguyên văn được chọn bởi giới hạn ngữ cảnh.',
            ].map((item, i) => (
              <p key={item} className="text-[0.71875rem] text-foreground/55 leading-snug">
                <span className="text-muted-foreground mr-1.5">{i + 1}.</span>{item}
              </p>
            ))}
          </div>
          <Tip>
            Khi tạo lại hoặc chỉnh sửa trước live head, một authored record chỉ được đưa vào nếu nó khai báo
            valid-through prose fragment đứng trước mục tiêu đó. Cơ chế này ngăn dữ kiện tương lai rò ngược về quá khứ.
          </Tip>
        </>
      ),
    },
    {
      id: 'context-limit',
      title: 'Giới hạn ngữ cảnh',
      content: (
        <>
          <P>
            Cài đặt này kiểm soát lượng văn xuôi gần đây từ chuỗi được đưa vào prompt tạo nội dung (bước 2 của quy trình).
            Văn xuôi luôn được chọn từ cuối chuỗi đi ngược lại — phần viết mới nhất được ưu tiên.
          </P>
          <P>Có ba chế độ:</P>
          <P>
            <strong className="text-foreground/75">Fragment</strong> — Đưa N fragment văn xuôi gần nhất vào bất kể độ dài.
            Mặc định là 10. Đơn giản và dễ dự đoán.
          </P>
          <P>
            <strong className="text-foreground/75">Token</strong> — Đưa văn xuôi gần đây vào tới một ngân sách token ước tính.
            Token được ước lượng theo 1 token cho 4 ký tự. Dùng khi độ dài fragment chênh lệch nhiều và bạn muốn kích thước
            prompt ổn định.
          </P>
          <P>
            <strong className="text-foreground/75">Ký tự</strong> — Đưa văn xuôi gần đây vào tới một số lượng ký tự thô.
            Hữu ích khi cần kiểm soát chính xác kích thước ngữ cảnh.
          </P>
          <P>
            Ở mọi chế độ, luôn có ít nhất một fragment văn xuôi được đưa vào ngay cả khi vượt ngân sách.
            Văn xuôi đã phân tích nằm trước giới hạn được đại diện bằng phép chiếu bộ nhớ liên kết nguồn, nên mô hình vẫn có
            nhận thức lịch sử có giới hạn mà không phải nhận lại toàn bộ văn bản thô.
          </P>
          <Tip>
            Giới hạn lớn hơn giúp mô hình thấy nhiều văn xuôi thật hơn, hỗ trợ tính nhất quán và giọng văn.
            Đổi lại, mỗi lần tạo tốn nhiều token hơn và có thể đẩy ngữ cảnh khác (hướng dẫn, nhân vật) ra xa vùng chú ý hơn.
            Hãy tìm mức cân bằng phù hợp với truyện của bạn.
          </Tip>
        </>
      ),
    },
    {
      id: 'keyboard-shortcuts',
      title: 'Phím tắt',
      content: (
        <>
          <P>
            Phím tắt được quản lý bởi plugin <strong className="text-foreground/75">Keybinds</strong>.
            Bật plugin này trong Cài đặt để cấu hình phím tắt cho tạo nội dung, điều hướng và các thao tác khác.
          </P>
          <P>Một số mặc định khi plugin đang hoạt động:</P>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] text-foreground/65">Tạo và lưu</span>
              <span className="flex items-center gap-1"><Kbd>Ctrl</Kbd><span className="text-muted-foreground">+</span><Kbd>Enter</Kbd></span>
            </div>
            <div className="h-px bg-border/15" />
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] text-foreground/65">Đóng bảng / hộp thoại</span>
              <Kbd>Esc</Kbd>
            </div>
          </div>
          <Tip>
            Xem bảng plugin Keybinds để biết đầy đủ các phím tắt khả dụng và tùy chỉnh chúng.
          </Tip>
        </>
      ),
    },
    {
      id: 'guided-mode',
      title: 'Chế độ có hướng dẫn',
      content: (
        <>
          <P>Ô tạo nội dung có hai chế độ, chuyển đổi bằng biểu tượng la bàn:</P>
          <P>
            <strong className="text-foreground/75">Tự do</strong> — Tự nhập hướng dẫn cho lần tạo tiếp theo. Đây là mặc định.
          </P>
          <P>
            <strong className="text-foreground/75">Có hướng dẫn</strong> — Librarian đề xuất một số hướng phát triển truyện
            dựa trên mạch truyện hiện tại. Mỗi đề xuất là một thẻ có tiêu đề, mô tả và hướng dẫn viết có thể dùng ngay.
            Nhấp thẻ để dùng làm đầu vào tạo nội dung, hoặc nhấn nút làm mới để yêu cầu đề xuất khác.
          </P>
          <Tip>
            Các hướng đi có hướng dẫn được tạo từ phân tích Librarian gần nhất. Nếu chưa có đề xuất, hãy tạo văn xuôi trước
            để Librarian có ngữ cảnh. Bạn cũng có thể làm mới đề xuất thủ công bất kỳ lúc nào.
          </Tip>
        </>
      ),
    },
    {
      id: 'aborting',
      title: 'Dừng quá trình tạo',
      content: (
        <>
          <P>
            Khi quá trình tạo đang chạy, nhấn <strong className="text-foreground/75">nút tạm dừng</strong> để dừng
            server-owned run. Việc dừng sẽ loại bỏ đoạn viết chưa hoàn tất thay vì lưu văn xuôi một phần,
            đồng thời giữ lại hướng dẫn của tác giả để bạn chỉnh sửa hoặc thử lại.
          </P>
        </>
      ),
    },
    {
      id: 'agent-indicator',
      title: 'Hoạt động của agent',
      content: (
        <>
          <P>
            Các quầng sáng động trong trình biên tập truyện cho biết agent nền nào đang chạy.
            Mỗi loại agent có màu riêng — rê chuột lên một quầng sáng để xem agent nào đang hoạt động và đang làm gì.
          </P>
          <P>
            Các agent thường gặp: <strong className="text-foreground/75">Librarian</strong> (phân tích, tinh chỉnh, chat),
            <strong className="text-foreground/75"> Character Chat</strong>,
            <strong className="text-foreground/75"> Directions</strong> (đề xuất) và
            <strong className="text-foreground/75"> Writer</strong> (tạo văn xuôi).
          </P>
        </>
      ),
    },
    {
      id: 'dialogue-formatting',
      title: 'Định dạng hội thoại',
      content: (
        <>
          <P>
            Hội thoại đặt trong dấu ngoặc kép ở các prose block được tự động hiển thị nghiêng để dễ phân biệt.
            Đây chỉ là biến đổi hiển thị — văn bản gốc không thay đổi.
          </P>
        </>
      ),
    },
    {
      id: 'debug-panel',
      title: 'Bảng Debug',
      content: (
        <>
          <P>
            Bảng Debug cho phép kiểm tra log của một lần tạo sau khi hoàn tất. Mỗi log ghi lại đầy đủ prompt
            (system + user message), mọi lần gọi công cụ cùng đối số và kết quả, đầu ra của mô hình và số liệu thời gian.
          </P>
          <P>
            Mở từ nút <strong className="text-foreground/75">Debug</strong> trong bảng tạo nội dung,
            hoặc từ <strong className="text-foreground/75">biểu tượng debug</strong> trên bất kỳ prose block nào
            trong chế độ xem chuỗi.
          </P>
          <Tip>
            Dùng bảng Debug để hiểu vì sao mô hình đưa ra lựa chọn nhất định. Xem tab Prompt để biết chính xác ngữ cảnh
            đã được gửi và tab Tools để xem mô hình đã tra cứu fragment nào.
          </Tip>
        </>
      ),
    },
  ],
}

export const VI_HELP_SECTIONS: HelpSection[] = HELP_SECTIONS.map((section) => (
  section.id === VI_GENERATION_SECTION.id ? VI_GENERATION_SECTION : section
))
