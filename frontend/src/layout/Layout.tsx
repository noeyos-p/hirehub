import Footer from "./footer/Footer";
import Header from "./header/Header";
import MobileBottomNav from "./MobileBottomNav";

const Layout = (props: {
  children: React.ReactNode
}) => {
  return(
    <div>
      <Header />

      <main className="pb-16 md:pb-0">
        {props.children}
      </main>

      {/* 데스크톱 Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav />
    </div>
  )
}

export default Layout