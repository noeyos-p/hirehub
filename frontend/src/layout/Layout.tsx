import Footer from "./footer/Footer";
import Header from "./header/Header";

const Layout = (props: {
  children: React.ReactNode
}) => {
  return(
    <div>
      <Header />

      <main>
        {props.children}
      </main>

      <Footer />
    </div>
  )
}

export default Layout