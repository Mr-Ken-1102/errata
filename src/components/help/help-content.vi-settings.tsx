import type { HelpSection } from './help-content'
import { Mono, P, Tip } from './help-content.vi-primitives'

export const VI_SETTINGS_SECTION: HelpSection = {
  id: 'settings',
  title: 'Cài đặt',
  description: 'Cấu hình nhà cung cấp, plugin, giao diện và hành vi tạo nội dung.',
  subsections: [
    {
      id: 'overview',
      title: 'Bố cục Cài đặt',
      content: (
        <>
          <P>
            Cài đặt mở dưới dạng lớp phủ neo bên trái với danh sách mục riêng. Dùng mục lục để chuyển nhanh
            giữa các điều khiển giao diện, kiểu chữ, đọc thành tiếng, nhà cung cấp, tạo nội dung,
            hỗ trợ viết, truy cập từ xa và plugin.
          </P>
          <P>
            Các tùy chọn giao diện như theme, kích thước UI, độ rộng prose, cỡ chữ prose, đánh dấu khi nhắc
            đến nhân vật, thanh dòng thời gian, màu chữ prose và CSS tùy chỉnh là tùy chọn UI cục bộ.
            Các điều khiển tạo nội dung, bộ nhớ, nhà cung cấp, plugin và truy cập từ xa ảnh hưởng đến
            truyện hiện tại hoặc ứng dụng đang chạy.
          </P>
        </>
      ),
    },
    {
      id: 'providers',
      title: 'Nhà cung cấp mô hình',
      content: (
        <>
          <P>
            Errata hỗ trợ nhiều nhà cung cấp mô hình. Mỗi nhà cung cấp có API endpoint và key.
            Cài đặt cung cấp các vai trò mô hình cấp namespace cho generation, librarian, character chat
            và direction suggestions. Từng agent vẫn có thể ghi đè provider, model, temperature,
            Top P và Top K từ bảng Agents. Các trường sampling để trống sẽ kế thừa từ vai trò cha
            hoặc để mô hình/nhà cung cấp tự quyết định.
          </P>
          <P>
            Thêm hoặc chỉnh sửa nhà cung cấp qua bảng Manage Providers trong Cài đặt. Có thể dùng endpoint
            tương thích OpenAI miễn là nhà cung cấp trả về chat completions tương thích.
            Chọn Google Gemini để dùng các mô hình Gemini qua Generative Language API gốc của Google,
            bao gồm model discovery và tool calling gốc.
          </P>
          <P>
            OpenRouter cũng có thể được kết nối qua luồng đăng nhập trình duyệt thay vì nhập API key thủ công.
            Khi kết nối theo cách này, Errata thêm router <Mono>openrouter/free</Mono> vào danh sách mô hình
            và đánh dấu các mô hình OpenRouter không mất phí là free.
            Nếu Errata chạy trên port <Mono>3000</Mono>, ứng dụng nhận OpenRouter callback trực tiếp.
            Trên các local port khác, Errata khởi động một localhost callback bridge nhỏ trên port{' '}
            <Mono>3000</Mono> để OpenRouter hoàn tất authorization và hiển thị thông báo đã kết nối
            trong cửa sổ trình duyệt.
          </P>
        </>
      ),
    },
    {
      id: 'read-aloud',
      title: 'Đọc thành tiếng',
      content: (
        <>
          <P>
            Bật <strong className="text-foreground/75">Đọc thành tiếng</strong> trong Cài đặt để thêm
            thao tác Đọc thành tiếng cho mọi passage và một player mảnh ở cuối màn hình. Tính năng này
            mặc định tắt. Passage được tổng hợp và phát theo từng câu, nên âm thanh bắt đầu gần như ngay lập tức
            thay vì phải chờ toàn bộ passage.
          </P>
          <P>
            <strong className="text-foreground/75">Browser</strong> dùng các giọng đọc tích hợp của hệ thống —
            dùng ngay, không cần tải xuống. <strong className="text-foreground/75">Supertonic</strong>{' '}
            là giọng neural chất lượng cao chạy hoàn toàn trong trình duyệt (trên GPU khi có thể);
            lần đầu sử dụng, model tải xuống khoảng <strong>~200 MB</strong> và sau đó được cache để dùng offline.
            Chọn giọng preset, điều chỉnh quality, speed, pitch và volume, rồi dùng Test voice để nghe thử.
          </P>
          <P>
            Thanh player được ghim ở cuối khi audio đang tải, phát, tạm dừng hoặc gặp lỗi.
            Dùng nút mute để điều khiển nhanh âm lượng, nút sliders để chỉnh speed, pitch và volume,
            và Stop để kết thúc phiên đọc thành tiếng.
          </P>
        </>
      ),
    },
    {
      id: 'appearance',
      title: 'Giao diện',
      content: (
        <>
          <P>
            Các mục Interface và Typography kiểm soát hình thức của Errata khi bạn viết. Bạn có thể đổi
            theme ứng dụng, scale UI, điều chỉnh độ rộng đọc prose và cỡ chữ, chọn font cho các vai trò
            display/prose/interface/code và tùy chỉnh màu chữ prose.
          </P>
          <P>
            CSS tùy chỉnh được áp dụng toàn cục khi bật. Hãy dùng nó cho các điều chỉnh giao diện riêng
            của dự án mà các tùy chọn giao diện tích hợp chưa hỗ trợ.
          </P>
        </>
      ),
    },
    {
      id: 'authoring',
      title: 'Hỗ trợ viết',
      content: (
        <>
          <P>
            Mục Authoring chứa các công cụ hỗ trợ viết ảnh hưởng đến prose editor và luồng guided generation.
            Selection transforms xuất hiện trên floating toolbar khi văn bản được chọn trong writing panel;
            custom transforms có thể được bật, tắt và sắp xếp lại.
          </P>
          <P>
            Prompt của Guided mode cho phép thay thế các prompt Continue, Scene-setting và Suggest directions
            mặc định được inline generation input sử dụng.
          </P>
        </>
      ),
    },
    {
      id: 'remote',
      title: 'Truy cập từ xa',
      content: (
        <>
          <P>
            Truy cập từ xa cho phép bạn mở ứng dụng Errata đang chạy từ thiết bị khác. Trước tiên hãy bật
            Basic Auth với username và password; chia sẻ mạng vẫn bị tắt cho đến khi đặt password.
          </P>
          <P>
            <strong className="text-foreground/75">Mạng cục bộ</strong> đưa Errata lên Wi-Fi của bạn
            và hiển thị URL có thể sao chép cùng mã QR. Truy cập qua mạng cục bộ dùng HTTP thuần,
            vì vậy password không được mã hóa trên LAN.
          </P>
          <P>
            <strong className="text-foreground/75">Internet</strong> khởi động một liên kết Cloudflare
            Tunnel HTTPS tạm thời. Errata tự động tải <Mono>cloudflared</Mono> khi cần và hiển thị
            trạng thái tunnel, URL có thể sao chép và mã QR khi tunnel đang chạy.
          </P>
        </>
      ),
    },
    {
      id: 'prompt-control',
      title: 'Thứ tự fragment',
      content: (
        <>
          <P>
            Cài đặt <strong className="text-foreground/75">Fragment ordering</strong> kiểm soát cách
            các sticky fragment được sắp xếp bên trong prompt.
          </P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-1.5">
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Grouped</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Mặc định — sticky fragment được gom theo loại (guideline, rồi knowledge, rồi character).
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">Custom</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Mở khóa bảng <strong className="text-foreground/75">Fragment Order</strong> trong sidebar.
                Kéo các pinned fragment vào thứ tự tùy chỉnh và chuyển vị trí của chúng giữa
                system message và user message.
              </p>
            </div>
          </div>
          <Tip>
            Để kiểm soát ở cấp block — tắt, sắp xếp lại, ghi đè hoặc thêm custom block —
            hãy mở tab <strong className="text-foreground/75">Agents</strong> và cấu hình riêng từng agent.
            Xem mục trợ giúp <strong className="text-foreground/75">Context blocks</strong>.
          </Tip>
        </>
      ),
    },
    {
      id: 'plugins',
      title: 'Plugin',
      content: (
        <>
          <P>
            Plugin mở rộng Errata bằng fragment type, model tool, API route và sidebar panel mới.
            Bật hoặc tắt chúng theo từng truyện trong Cài đặt.
          </P>
          <P>Mỗi plugin có thể hook vào bốn giai đoạn của generation pipeline:</P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-1.5">
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">beforeContext</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Chạy sau khi fragment được nạp nhưng trước khi message được lắp ráp. Plugin có thể
                thêm, xóa hoặc sắp xếp lại fragment trong context state.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">beforeGeneration</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Chạy sau khi message được lắp ráp. Plugin có thể sửa system message và user message cuối cùng
                trước khi chúng được gửi tới mô hình.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">afterGeneration</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Chạy sau khi mô hình phản hồi. Plugin có thể biến đổi văn bản được tạo trước khi
                nó được lưu thành fragment.
              </p>
            </div>
            <div className="h-px bg-border/15" />
            <div>
              <p className="text-[0.71875rem] font-medium text-foreground/65">afterSave</p>
              <p className="text-[0.6875rem] text-muted-foreground leading-snug">
                Chạy sau khi prose fragment đã được lưu bền vững. Plugin có thể kích hoạt side effect
                như notification hoặc external sync.
              </p>
            </div>
          </div>
          <P>
            Plugin cũng có thể đăng ký custom model tool để mô hình gọi trong lúc tạo nội dung,
            bên cạnh các fragment tool tích hợp.
          </P>
        </>
      ),
    },
  ],
}
