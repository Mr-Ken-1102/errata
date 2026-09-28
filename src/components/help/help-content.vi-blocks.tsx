import type { HelpSection } from './help-content'
import { Mono, P, Tip } from './help-content.vi-primitives'

export const VI_BLOCKS_SECTION: HelpSection = {
  id: 'blocks',
  title: 'Khối ngữ cảnh',
  description: 'Kiểm soát cấu trúc ngữ cảnh của mô hình — tắt, sắp xếp lại, ghi đè và tạo block riêng cho từng agent.',
  subsections: [
    {
      id: 'overview',
      title: 'Block là gì',
      content: (
        <>
          <P>
            Mỗi prompt tạo nội dung được xây dựng từ các <strong className="text-foreground/75">block</strong> —
            những phần tách biệt như hướng dẫn viết, danh sách công cụ, thông tin truyện, lịch sử văn xuôi và
            hướng dẫn hiện tại của tác giả. Các block được lắp ráp tự động từ dữ liệu truyện, rồi biên dịch thành
            system message và user message mà mô hình nhìn thấy.
          </P>
          <P>
            Block được cấu hình <strong className="text-foreground/75">riêng cho từng agent</strong>. Mở tab{' '}
            <strong className="text-foreground/75">Agents</strong> trong sidebar và chọn một agent
            (writer, librarian analyze, librarian chat, v.v.) để xem các block của agent đó. Mỗi agent có thứ tự,
            override và custom block riêng — tinh chỉnh Writer không làm thay đổi Librarian.
          </P>
          <Tip>
            Dùng nút <strong className="text-foreground/75">Preview</strong> ở đầu bảng cấu hình để xem chính xác
            prompt sau khi biên dịch của agent đó sẽ trông như thế nào khi áp dụng các thay đổi của bạn.
          </Tip>
        </>
      ),
    },
    {
      id: 'builtin-blocks',
      title: 'Block tích hợp',
      content: (
        <>
          <P>
            Các block này được tạo tự động từ dữ liệu truyện. Chúng xuất hiện trong mỗi lần tạo nội dung
            (trừ khi bạn tắt chúng).
          </P>
          <div className="mt-3 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">System message</p>
            <div className="space-y-1.5 mb-3">
              {[
                ['instructions', 'Hướng dẫn cốt lõi cho trợ lý viết và các quy tắc đầu ra.'],
                ['tools', 'Danh sách công cụ mà mô hình có thể gọi trong lúc tạo nội dung.'],
                ['system-fragments', 'Các fragment sticky được đặt ở vị trí "system" (nếu có).'],
              ].map(([name, desc]) => (
                <div key={name} className="flex gap-2 items-start">
                  <code className="text-[0.65625rem] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded shrink-0 mt-px">{name}</code>
                  <p className="text-[0.71875rem] text-muted-foreground leading-snug">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">User message</p>
            <div className="space-y-1.5">
              {[
                ['story-info', 'Tên và mô tả truyện.'],
                ['summary', 'Bộ nhớ truyện có giới hạn, liên kết nguồn dành cho văn xuôi trước cửa sổ gần đây.'],
                ['user-fragments', 'Các fragment sticky được đặt ở vị trí "user" (nếu có).'],
                ['fragment-catalog', 'Các dòng danh mục một dòng được nhóm theo loại fragment.'],
                ['prose', 'Văn xuôi gần đây từ chuỗi, bị giới hạn bởi cài đặt giới hạn ngữ cảnh.'],
                ['author-input', 'Hướng dẫn của bạn về điều nên xảy ra tiếp theo.'],
              ].map(([name, desc]) => (
                <div key={name} className="flex gap-2 items-start">
                  <code className="text-[0.65625rem] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded shrink-0 mt-px">{name}</code>
                  <p className="text-[0.71875rem] text-muted-foreground leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <Tip>
            Một số block có điều kiện — <Mono>summary</Mono> chỉ xuất hiện khi có bộ nhớ liên kết nguồn
            hoặc authored memory, còn <Mono>system-fragments</Mono> chỉ xuất hiện khi có fragment sticky
            được đặt trong system message.
          </Tip>
        </>
      ),
    },
    {
      id: 'disabling',
      title: 'Tắt block',
      content: (
        <>
          <P>
            Nhấp <strong className="text-foreground/75">nút bật/tắt</strong> trên bất kỳ hàng block nào để
            tắt nó. Block đã tắt bị loại hoàn toàn khỏi prompt — mô hình sẽ không nhìn thấy nội dung đó.
          </P>
          <P>
            Một số cách dùng thường gặp: tắt block <Mono>tools</Mono> nếu bạn không muốn mô hình gọi công cụ,
            tắt <Mono>summary</Mono> nếu bộ nhớ lịch sử không hữu ích cho một agent cụ thể, hoặc tắt các dòng
            danh mục để giữ prompt ngắn hơn.
          </P>
          <Tip>
            Tắt một block không xóa dữ liệu — bạn có thể bật lại bất kỳ lúc nào để khôi phục nó.
          </Tip>
        </>
      ),
    },
    {
      id: 'overriding',
      title: 'Ghi đè nội dung',
      content: (
        <>
          <P>
            Mở rộng bất kỳ builtin block nào để xem trước nội dung và điều chỉnh nó. Chọn một
            <strong className="text-foreground/75"> content mode</strong>:
          </P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-1.5">
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">None — Không thay đổi</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Mặc định — block dùng nội dung gốc mà không có chỉnh sửa.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Prepend — Chèn trước</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Văn bản của bạn được chèn trước nội dung gốc của block. Dùng cách này để thêm quy tắc
                hoặc ngữ cảnh ở đầu mà vẫn giữ nội dung mặc định.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Append — Chèn sau</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Văn bản của bạn được thêm sau nội dung gốc của block. Phù hợp để bổ sung ghi chú.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Override — Thay thế</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Nội dung gốc của block được thay hoàn toàn bằng văn bản của bạn. Dùng cách này để viết
                system prompt riêng hoặc định nghĩa lại toàn bộ một phần.
              </p>
            </div>
          </div>
          <Tip>
            Override block <Mono>instructions</Mono> là cách mạnh để tùy chỉnh hành vi mô hình mà không cần
            viết plugin. Ví dụ, bạn có thể thay nó bằng hướng dẫn viết dành riêng cho một thể loại.
          </Tip>
        </>
      ),
    },
    {
      id: 'reordering',
      title: 'Sắp xếp lại block',
      content: (
        <>
          <P>
            Kéo block bằng <strong className="text-foreground/75">tay nắm kéo</strong> để sắp xếp lại.
            Thứ tự chỉ áp dụng trong cùng nhóm role — system block được sắp với system block,
            còn user block được sắp với user block.
          </P>
          <P>
            Thứ tự ảnh hưởng đến phần nội dung mà mô hình chú ý. Mô hình thường tập trung nhiều hơn vào nội dung
            ở đầu và cuối một message. Hãy đặt ngữ cảnh quan trọng nhất cho phù hợp.
          </P>
        </>
      ),
    },
    {
      id: 'custom-blocks',
      title: 'Custom block',
      content: (
        <>
          <P>
            Nhấp <strong className="text-foreground/75">Add Context Block</strong> ở cuối bảng cấu hình của agent
            để chèn nội dung riêng vào prompt. Custom block nằm cạnh builtin block và có thể được sắp xếp lại,
            bật hoặc tắt theo cùng cách.
          </P>
          <P>
            Khi tạo custom block, hãy chọn:
          </P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-1.5">
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Role</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                <Mono>system</Mono> dành cho hướng dẫn và quy tắc mô hình phải tuân theo.{' '}
                <Mono>user</Mono> dành cho ngữ cảnh truyện và tài liệu tham chiếu.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Type: Simple</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Văn bản thuần được chèn nguyên trạng. Dùng cho hướng dẫn tĩnh, quy tắc thế giới,
                hướng dẫn phong cách hoặc bất kỳ nội dung cố định nào.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Type: Script</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                JavaScript chạy ở thời điểm tạo nội dung và trả về một chuỗi. Script truy cập dữ liệu truyện
                qua tham số <Mono>ctx</Mono>. Block bị bỏ qua nếu script trả về chuỗi rỗng.
              </p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'script-blocks',
      title: 'Script block',
      content: (
        <>
          <P>
            Script block là custom block chạy JavaScript ở thời điểm tạo nội dung. Hãy viết thân hàm nhận
            <Mono>ctx</Mono> và trả về một chuỗi. Nếu script trả về chuỗi rỗng hoặc phát sinh lỗi,
            block sẽ được xử lý an toàn.
          </P>
          <div className="mt-3 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Có sẵn trên ctx</p>
            <div className="space-y-1 mb-3">
              {[
                ['ctx.story', 'Metadata của truyện — tên, mô tả, ảnh bìa và cài đặt.'],
                ['ctx.proseFragments', 'Các prose fragment gần đây được đưa vào ngữ cảnh.'],
                ['ctx.stickyGuidelines', 'Guideline fragment đã ghim (toàn bộ nội dung).'],
                ['ctx.stickyKnowledge', 'Knowledge fragment đã ghim (toàn bộ nội dung).'],
                ['ctx.stickyCharacters', 'Character fragment đã ghim (toàn bộ nội dung).'],
                ['ctx.guidelineCatalog', 'Guideline không ghim được render thành các dòng danh mục.'],
                ['ctx.knowledgeCatalog', 'Knowledge không ghim được render thành các dòng danh mục.'],
                ['ctx.characterCatalog', 'Character không ghim được render thành các dòng danh mục.'],
                ['ctx.authorInput', 'Hướng dẫn hiện tại của tác giả.'],
                ['ctx.getFragment(id)', 'Lấy một fragment bất kỳ theo ID (async — dùng await).'],
                ['ctx.getFragments(type?)', 'Liệt kê mọi fragment, có thể lọc theo type (async).'],
                ['ctx.getFragmentByTag(tag)', 'Lấy fragment đầu tiên có tag khớp, hoặc null (async).'],
                ['ctx.getFragmentsByTag(tag)', 'Lấy mọi fragment có tag khớp (async).'],
              ].map(([field, desc]) => (
                <div key={field} className="flex gap-2 items-start">
                  <code className="text-[0.65625rem] font-mono text-primary/70 bg-primary/5 px-1 py-0.5 rounded shrink-0 mt-px">{field}</code>
                  <p className="text-[0.6875rem] text-muted-foreground leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Ví dụ</p>
            <div className="space-y-2">
              <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2 text-[0.6875rem] font-mono text-foreground/55 leading-relaxed whitespace-pre-wrap">{`// Word count tracker
const total = ctx.proseFragments
  .reduce((n, f) => n + f.content.split(/\\s+/).length, 0)
return \`Current story length: ~\${total} words.\``}</div>
              <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2 text-[0.6875rem] font-mono text-foreground/55 leading-relaxed whitespace-pre-wrap">{`// Active character reminder
const names = ctx.stickyCharacters
  .map(c => c.name).join(', ')
if (!names) return ''
return \`Active characters: \${names}.\``}</div>
              <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2 text-[0.6875rem] font-mono text-foreground/55 leading-relaxed whitespace-pre-wrap">{`// Conditional pacing note
const n = ctx.proseFragments.length
if (n < 3) return 'Early story — establish setting.'
if (n > 15) return 'Move toward resolution.'
return ''`}</div>
              <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2 text-[0.6875rem] font-mono text-foreground/55 leading-relaxed whitespace-pre-wrap">{`// Fetch a specific fragment by ID
const frag = await ctx.getFragment('kn-abc123')
if (!frag) return ''
return \`Reminder: \${frag.content}\``}</div>
              <div className="rounded-md border border-border/25 bg-accent/15 px-3 py-2 text-[0.6875rem] font-mono text-foreground/55 leading-relaxed whitespace-pre-wrap">{`// Lookup by tag (stable across imports)
const rules = await ctx.getFragmentsByTag('combat')
if (!rules.length) return ''
return rules.map(r => r.content).join('\\n')`}</div>
            </div>
          </div>
          <div className="mt-3 mb-1">
            <p className="text-[0.625rem] text-muted-foreground uppercase tracking-wider mb-2">Xem trước trực tiếp</p>
            <P>
              Trình sửa script hiển thị bản xem trước đầu ra khi bạn nhập — script được chạy thử với dữ liệu truyện
              hiện tại sau một khoảng debounce ngắn. Bảng <strong className="text-foreground/75">Fragment Reference</strong>{' '}
              có thể thu gọn liệt kê mọi fragment ID khả dụng để bạn sao chép vào script.
            </P>
          </div>
          <Tip>
            Nếu script phát sinh lỗi, block hiển thị thông báo "[Script error]" trong prompt để bạn dễ nhận ra vấn đề.
            Bản xem trước trực tiếp sẽ bắt lỗi ngay khi bạn chỉnh sửa.
          </Tip>
        </>
      ),
    },
  ],
}
