import type { HelpSection } from './help-content'
import { Kbd, Mono, P, Tip } from './help-content.vi-primitives'

export const VI_LIBRARIAN_SECTION: HelpSection = {
  id: 'librarian',
  title: 'Librarian',
  description: 'Agent nền duy trì bộ nhớ và kiến thức của câu chuyện.',
  subsections: [
    {
      id: 'overview',
      title: 'Librarian làm gì',
      content: (
        <>
          <P>
            Librarian là agent nền tự động chạy sau mỗi lần tạo prose. Nó nhận prose gần đây,
            các fragment đầy đủ đã được promote và catalog rút gọn cho phần còn lại. Librarian duy trì
            summary, phát hiện các lần nhắc fragment chính xác, ghi nhận continuity, đánh dấu mâu thuẫn
            và đề xuất những chỉnh sửa hồ sơ có phạm vi hẹp, được bằng chứng hỗ trợ.
          </P>
          <P>
            Mỗi lần bạn tạo prose, Librarian phân tích đoạn mới trong bối cảnh toàn bộ nội dung đã viết.
            Nó hoạt động như bộ nhớ của câu chuyện, giúp phát hiện những chi tiết dễ bị bỏ sót khi mạch truyện dài lên.
          </P>
          <P>
            Bạn có thể tắt phân tích tự động sau khi tạo nội dung trong Cài đặt nếu muốn lưu prose
            mà không chạy Librarian ngay lập tức.
          </P>
        </>
      ),
    },
    {
      id: 'continuity-memory',
      title: 'Bộ nhớ tính liên tục',
      content: (
        <>
          <P>
            Phân tích ghi lại các thay đổi trạng thái có liên kết nguồn, khung thời gian,
            vòng đời của mạch truyện chưa giải quyết và những thay đổi kiến thức nhân vật được nêu rõ.
            Writer nhận một continuity view rút gọn mà không cần chờ thêm một model call.
            Prose sự kiện cũ vẫn nằm cùng summary thay vì tạo thành một kênh lịch sử thứ hai.
          </P>
          <P>
            Mạch truyện chưa giải quyết là bộ nhớ, không phải danh sách việc cần làm. Một thread có thể ở trạng thái
            <Mono>foreground</Mono>, <Mono>background</Mono> hoặc <Mono>dormant</Mono>; thread dormant vẫn được ghi nhớ
            nhưng không ép Writer phải nhắc lại hay giải quyết nó. Việc giải quyết hoặc từ bỏ đòi hỏi một sự kiện
            được nêu rõ trong prose.
          </P>
          <P>
            Character sheet và world fragment là tài liệu tham chiếu toàn tri dành cho tác giả; chúng không khiến
            mọi nhân vật tự động biết nội dung bên trong. Continuity view chỉ ghi các sự thật được nhân vật học,
            được sửa lại hoặc quên đi một cách rõ ràng, bao gồm nguồn nhận biết là <Mono>witnessed</Mono>,
            <Mono>told</Mono> hay <Mono>inferred</Mono>. Hệ thống không tự suy ra một danh sách toàn cục về
            mọi nhân vật đang hiện diện.
          </P>
        </>
      ),
    },
    {
      id: 'chat-tab',
      title: 'Trò chuyện',
      content: (
        <>
          <P>
            Tab <strong className="text-foreground/75">Trò chuyện</strong> cho phép bạn trao đổi trực tiếp
            với Librarian về câu chuyện. Bạn có thể hỏi về nhân vật, mạch truyện, timeline hoặc nội dung khác —
            Librarian có quyền truy cập đầy đủ vào toàn bộ fragment của bạn và lịch sử phân tích của chính nó.
          </P>
          <Tip>
            Có thể hỏi như “Chúng ta biết gì về nhân vật này?” hoặc “Có mạch truyện nào chưa giải quyết không?”.
            Librarian sẽ dựa trên những gì nó đã phân tích.
          </Tip>
        </>
      ),
    },
    {
      id: 'story-tab',
      title: 'Câu chuyện',
      content: (
        <>
          <P>
            Tab <strong className="text-foreground/75">Câu chuyện</strong> hiển thị phân tích đang được Librarian
            duy trì cho mạch truyện. Nội dung được chia thành nhiều phần:
          </P>
          <P>
            <strong className="text-foreground/75">Phát hiện</strong> — tổng quan nhanh về số mâu thuẫn
            và đề xuất đang chờ trên toàn bộ các lần phân tích.
          </P>
          <P>
            <strong className="text-foreground/75">Phân tích</strong> — mỗi lần tạo prose có một mục phân tích riêng.
            Mở rộng mục đó để xem nhân vật xuất hiện, mâu thuẫn được phát hiện, đề xuất thay đổi fragment
            và các sự kiện timeline.
          </P>
          <P>
            <strong className="text-foreground/75">Nhân vật</strong> — theo dõi nhân vật nào được nhắc trong
            prose gần đây và tần suất xuất hiện, giúp bạn thấy ai đang hoạt động trong câu chuyện.
          </P>
          <P>
            <strong className="text-foreground/75">Dòng thời gian</strong> — danh sách theo trình tự thời gian
            các sự kiện Librarian trích xuất từ prose, liên kết trở lại những fragment nguồn tương ứng.
          </P>
        </>
      ),
    },
    {
      id: 'summaries',
      title: 'Ghi nhớ do tác giả viết',
      content: (
        <>
          <P>
            Tab <strong className="text-foreground/75">Ghi nhớ</strong> liệt kê các summary fragment tùy chọn
            do bạn tự viết. Lịch sử Librarian được suy ra từ các phân tích có liên kết nguồn và không được lưu
            ở đây dưới dạng một rolling document có thể chỉnh sửa.
          </P>
          <P>
            Chọn một summary để mở trong <strong className="text-foreground/75">trình sửa toàn màn hình</strong> —
            cột đọc căn giữa dùng prose font, line-height rộng và tự lưu khi rời trường. Nhấn <Kbd>Esc</Kbd> để đóng.
            Đây là dữ liệu do tác giả sở hữu; Librarian không nối thêm hay ghi đè chúng trong các lần chạy.
          </P>
          <P>
            Lưu trữ một bản ghi do tác giả viết để loại nó khỏi prompt mà không xóa. Tùy chọn
            <strong className="text-foreground/75"> hiện mục đã lưu trữ</strong> ở cuối danh sách sẽ hiển thị
            các mục đã lưu để bạn có thể khôi phục sau.
          </P>
          <Tip>
            Bản ghi do tác giả viết là fragment thông thường có type <Mono>summary</Mono>. Tại một mục tiêu
            regeneration hoặc chỉnh sửa, chúng cần <Mono>meta.validThrough</Mono> trỏ tới prose trước đó;
            bản ghi không có scope chỉ render tại live story head.
          </Tip>
        </>
      ),
    },
    {
      id: 'manual-analysis',
      title: 'Phân tích thủ công',
      content: (
        <>
          <P>
            Prose block có thể được phân tích theo yêu cầu từ menu thao tác của block bằng lệnh
            <strong className="text-foreground/75"> Phân tích</strong>. Cách này hữu ích khi bạn chỉnh prose thủ công,
            tắt phân tích tự động hoặc muốn chạy lại Librarian cho một đoạn cụ thể.
          </P>
          <P>
            Prose block đã được phân tích hiển thị một chấm xanh nhỏ trong prose view để bạn nhanh chóng nhận ra
            đoạn nào đã có phân tích Librarian gắn kèm.
          </P>
        </>
      ),
    },
    {
      id: 'contradictions',
      title: 'Mâu thuẫn',
      content: (
        <>
          <P>
            Librarian đối chiếu prose mới với các fragment hiện có để phát hiện điểm không nhất quán.
            Khi tìm thấy, nó đánh dấu mâu thuẫn với mô tả và các fragment ID cụ thể có liên quan.
          </P>
          <P>
            Mỗi mâu thuẫn có nút <strong className="text-foreground/75">Xem xét</strong> để mở cuộc trò chuyện
            Librarian kèm các fragment liên quan. Dùng nút × bên cạnh để bỏ qua false positive hoặc một phát hiện
            bạn đã xử lý. Phát hiện bị bỏ qua vẫn nằm trong lịch sử phân tích đã lưu nhưng không còn hiển thị
            hay được tính là mâu thuẫn đang hoạt động.
          </P>
        </>
      ),
    },
    {
      id: 'suggestions',
      title: 'Đề xuất fragment',
      content: (
        <>
          <P>
            Librarian có thể đề xuất thay đổi fragment khi prose đã được chấp nhận khiến một khẳng định cụ thể
            trong fragment tái sử dụng hiện có trở nên sai, hoặc khi prose thiết lập một hồ sơ tái sử dụng thực sự mới.
            Chỉnh sửa hồ sơ hiện có và hồ sơ mới được phát hiện đi theo hai proposal path riêng và xuất hiện
            thành các mục review riêng. Mỗi đề xuất online phải dẫn chứng prose hỗ trợ bằng một đoạn trích nguyên văn
            hoặc các span nguyên văn theo thứ tự.
          </P>
          <P>
            Đề xuất cho fragment hiện có được lưu dưới dạng các thay thế chính xác, nhỏ gọn thay vì nối lịch sử scene
            hay viết lại toàn bộ sheet. Nếu model sao chép cả sheet trong khi chỉ đổi một khẳng định, Errata thu gọn
            thay đổi về local difference; broad rewrite sẽ bị từ chối. Sự kiện, điều kiện hiện tại, chuyển động quan hệ
            và open thread vẫn thuộc passage analysis. Nhấp nút <strong className="text-foreground/75">+</strong>
            để áp dụng một đề xuất đang chờ.
          </P>
          <Tip>
            Đề xuất cập nhật fragment hiện có sẽ hiển thị fragment mục tiêu để bạn xem xét trước khi chấp nhận.
          </Tip>
        </>
      ),
    },
    {
      id: 'refine',
      title: 'Tinh chỉnh fragment',
      content: (
        <>
          <P>
            Phần <strong className="text-foreground/75">Tinh chỉnh</strong> ở cuối tab Câu chuyện cho phép bạn
            yêu cầu Librarian viết lại hoặc cải thiện bất kỳ character, guideline hay knowledge fragment nào.
            Chọn fragment từ dropdown, nhập hướng dẫn tùy chọn và Librarian sẽ tạo phiên bản cập nhật.
          </P>
          <P>
            Tinh chỉnh cũng có thể được kích hoạt tự động từ nút Fix của mâu thuẫn, với phần hướng dẫn
            được điền sẵn theo vấn đề cần giải quyết.
          </P>
          <Tip>
            Dùng Tinh chỉnh để giữ fragment cập nhật khi câu chuyện phát triển — Librarian hiểu toàn bộ
            bối cảnh truyện khi thực hiện việc viết lại.
          </Tip>
        </>
      ),
    },
    {
      id: 'auto-suggestions',
      title: 'Tự động áp dụng đề xuất',
      content: (
        <>
          <P>
            Nút bật/tắt ở đầu bảng Librarian điều khiển việc đề xuất có được áp dụng tự động hay không.
            Khi bật, Librarian chỉ áp dụng những proposal đã vượt qua hợp đồng về bằng chứng online
            và thay đổi tối thiểu: chỉnh sửa cục bộ chính xác và/hoặc hồ sơ tái sử dụng mới được thiết lập.
          </P>
          <Tip>
            Tùy chọn này mặc định tắt. Hãy bật nếu bạn muốn Librarian chủ động duy trì hồ sơ tái sử dụng của truyện
            mà không cần kiểm tra từng thay đổi. Đề xuất tự động áp dụng vẫn có liên kết nguồn, có thể hoàn tác
            và được đánh dấu bằng badge <strong className="text-foreground/75">Tự động</strong>.
          </Tip>
        </>
      ),
    },
    {
      id: 'analysis-controls',
      title: 'Điều khiển phân tích',
      content: (
        <>
          <P>
            Cài đặt Tạo nội dung có một số điều khiển follow-up cho Librarian.
            <strong className="text-foreground/75"> Tắt tự động phân tích</strong> ngăn Librarian
            tự chạy sau khi tạo prose.
          </P>
          <P>
            <strong className="text-foreground/75">Tắt chỉ dẫn tự động</strong> tắt các direction được tạo
            trong quá trình Librarian phân tích; suggestion được yêu cầu thủ công vẫn khả dụng.
            <strong className="text-foreground/75"> Tắt đề xuất</strong> tắt cả chỉnh sửa fragment
            và đề xuất hồ sơ mới. Các tùy chọn này cho phép tiếp tục theo dõi summary và contradiction
            trong khi giảm đầu ra chủ động từ Librarian.
          </P>
        </>
      ),
    },
    {
      id: 'activity-tab',
      title: 'Hoạt động',
      content: (
        <>
          <P>
            Tab <strong className="text-foreground/75">Hoạt động</strong> hiển thị log của từng agent run
            mà Librarian đã thực hiện. Mỗi mục cho biết tên agent, thời điểm chạy, thời lượng và trạng thái
            thành công hay thất bại.
          </P>
          <P>
            Mở rộng một run để xem toàn bộ trace tree — Librarian có thể gọi các sub-agent
            (<Mono>analyze</Mono>, <Mono>refine</Mono>, <Mono>chat</Mono>) và bạn có thể xem trạng thái
            cũng như timing của từng bước.
          </P>
        </>
      ),
    },
    {
      id: 'status',
      title: 'Chỉ báo trạng thái',
      content: (
        <>
          <P>
            Dải trạng thái dưới các tab hiển thị trạng thái hiện tại của Librarian:
            chấm xanh lá nghĩa là idle, hổ phách là queued, xanh dương nhấp nháy là đang phân tích
            và đỏ biểu thị lỗi. Fragment ID đang được xử lý được hiển thị bên cạnh.
          </P>
        </>
      ),
    },
  ],
}
