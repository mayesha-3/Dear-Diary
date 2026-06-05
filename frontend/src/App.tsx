import "./App.css";


function App() {
  return (
    <>
      <header className="bg-white-400 p-4 flex items-center justify-between w-full">
        <div className="relative w-[4vw] h-[4vw]">
          {/* Profile picture */}
          <img
            src="/src/assets/dp.png" //dp path user
            alt="Profile"
            className="absolute p-2 inset-0 w-full h-full object-cover"
          />
          {/* Frame overlay */}
          <img
            src="/src/assets/vectorO.png" //frame of choise
            alt="Frame"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        </div>

        <div>
          <img className="h-[12vh]" src="src/assets/logo1.png" alt="My Dear Diary" />
        </div>
        <div>
          <img
            src="src/assets/hamburg.png"
            alt=""
            className="w-[4vw] h-[4vw] "
          />
        </div>
      </header>
      <main className="p-4">
        <p className="text-lg text-gray-700">
          Welcome to Dear Diary, your personal journaling app. Start writing
          your thoughts and memories today!
        </p>
      </main>

      {/* Joynab starts here 
      Footer banabi, try korbi accoddion effect diye footer er about us, contact etc open hoy emon korte*/}

      
    </>
  );
}

export default App;
