import type { HelpSection } from './help-content'
import { Mono, P, Tip } from './help-content.vi-primitives'

export const VI_TIMELINES_SECTION: HelpSection = {
  id: 'timelines',
  title: 'Dòng thời gian',
  description: 'Khám phá các hướng phát triển khác bằng cách tách nhánh câu chuyện tại bất kỳ điểm nào.',
  subsections: [
    {
      id: 'overview',
      title: 'Dòng thời gian là gì',
      content: (
        <>
          <P>
            Dòng thời gian cho phép bạn tách nhánh câu chuyện để khám phá những hướng đi khác mà không làm mất
            công việc trước đó. Mỗi dòng thời gian là một bản sao đầy đủ, độc lập của nội dung truyện — prose,
            fragment, dữ liệu Librarian và toàn bộ metadata.
          </P>
          <P>
            Mỗi truyện bắt đầu với một dòng thời gian duy nhất tên <strong className="text-foreground/75">Main</strong>.
            Bạn có thể tạo dòng thời gian mới ở bất kỳ điểm nào và từ đó mỗi dòng phát triển độc lập.
            Chỉnh sửa và lần tạo nội dung trong một dòng thời gian không bao giờ ảnh hưởng đến dòng khác.
          </P>
        </>
      ),
    },
    {
      id: 'creating',
      title: 'Tạo dòng thời gian',
      content: (
        <>
          <P>Có hai cách để tạo một dòng thời gian mới:</P>
          <P>
            <strong className="text-foreground/75">Từ thanh dòng thời gian</strong> — Nhấn nút{' '}
            <Mono>+</Mono> trên thanh phía trên. Thao tác này tạo một bản sao đầy đủ của dòng thời gian hiện tại,
            bao gồm toàn bộ prose và fragment. Sau đó bạn có thể tiếp tục viết từ cuối dòng mới.
          </P>
          <P>
            <strong className="text-foreground/75">Từ một phần prose</strong> — Nhấn nút{' '}
            <strong className="text-foreground/75">Dòng thời gian</strong> trên bất kỳ prose block nào trong chain view.
            Thao tác này tách nhánh câu chuyện <em>ngay tại điểm đó</em> — dòng thời gian mới giữ mọi nội dung
            đến và bao gồm phần đã chọn, rồi bạn viết một hướng tiếp diễn khác từ đó.
          </P>
          <Tip>
            Tách nhánh từ một phần prose cụ thể là cách dùng phổ biến nhất. Nó cho phép bạn hỏi
            “nếu từ đây câu chuyện diễn ra khác đi thì sao?” và khám phá câu trả lời mà không ảnh hưởng
            đến mạch truyện chính.
          </Tip>
        </>
      ),
    },
    {
      id: 'switching',
      title: 'Chuyển dòng thời gian',
      content: (
        <>
          <P>
            Nhấn tab của bất kỳ dòng thời gian nào trên thanh phía trên để chuyển sang dòng đó. Toàn bộ giao diện
            sẽ cập nhật — prose chain, fragment và trạng thái Librarian — để hiển thị nội dung của dòng thời gian
            đang chọn. Bạn có thể chuyển qua lại tự do mà không mất dữ liệu.
          </P>
          <P>
            Thanh dòng thời gian tự động xuất hiện khi truyện có nhiều hơn một dòng thời gian.
            Nếu đã ẩn thanh này, bạn có thể hiển thị lại từ bảng Dòng thời gian trong sidebar.
          </P>
        </>
      ),
    },
    {
      id: 'managing',
      title: 'Quản lý dòng thời gian',
      content: (
        <>
          <P>
            Rê chuột lên tab dòng thời gian đang hoạt động và nhấn menu <Mono>...</Mono> để mở các tùy chọn quản lý:
          </P>
          <P>
            <strong className="text-foreground/75">Đổi tên</strong> — Thay đổi tên của dòng thời gian.
            Tên chỉ là nhãn và không ảnh hưởng đến nội dung.
          </P>
          <P>
            <strong className="text-foreground/75">Xóa</strong> — Xóa vĩnh viễn một dòng thời gian cùng toàn bộ
            nội dung của nó. Thao tác này không thể hoàn tác. Dòng thời gian <strong className="text-foreground/75">Main</strong>
            không thể bị xóa.
          </P>
          <P>
            Bảng <strong className="text-foreground/75">Dòng thời gian</strong> trong sidebar cung cấp chế độ xem
            chi tiết hơn, cho biết dòng cha và điểm tách nhánh của từng dòng
            (ví dụ: “từ Main tại phần 3”).
          </P>
        </>
      ),
    },
    {
      id: 'isolation',
      title: 'Cô lập dữ liệu',
      content: (
        <>
          <P>
            Mỗi dòng thời gian hoàn toàn độc lập. Khi bạn tạo một dòng thời gian, mọi thứ được sao chép:
          </P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-0.5">
            {[
              'Prose chain và toàn bộ prose fragment',
              'Character, guideline và knowledge fragment',
              'Liên kết và tag của fragment',
              'Trạng thái Librarian, các lần phân tích và lịch sử chat',
              'Log tạo nội dung',
              'Cấu hình block',
            ].map((item, i) => (
              <p key={item} className="text-[0.71875rem] text-foreground/55 leading-snug">
                <span className="text-muted-foreground mr-1.5">{i + 1}.</span>{item}
              </p>
            ))}
          </div>
          <P>
            Sau khi sao chép, các dòng thời gian tách biệt hoàn toàn. Tạo một nhân vật trong một dòng thời gian
            sẽ không tạo nhân vật đó trong dòng khác. Librarian theo dõi câu chuyện của từng dòng một cách độc lập.
          </P>
          <Tip>
            Cài đặt cấp truyện (tên, mô tả và cấu hình mô hình) được dùng chung giữa mọi dòng thời gian.
            Chỉ nội dung bên trong từng dòng thời gian được cô lập.
          </Tip>
        </>
      ),
    },
  ],
}
