import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import AddPostPage from './pages/add-post'
import LoginPage from './pages/login'
import PostsPage from './pages/posts'
import SinglePostPage from './pages/single-post'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={<PostsPage />}
        />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/add-post' element={<AddPostPage />} />
        <Route path='/post/:id' element={<SinglePostPage />} />


      </Routes>
    </BrowserRouter>
  )

}

export default App
