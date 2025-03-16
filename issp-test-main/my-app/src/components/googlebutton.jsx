const GoogleButton = () => {
    return (
      <div className="flex items-center justify-center">
        <button className="flex items-center bg-white dark:bg-gray-900 border border-gray-300 rounded-lg shadow-md px-6 py-2 text-sm font-medium text-gray-800 dark:text-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
          <svg
            className="h-6 w-6 mr-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="-0.5 0 48 48"
            version="1.1"
          >
            <title>Google-color</title>
            <g fill="none" fillRule="evenodd">
              <g transform="translate(-401.000000, -860.000000)">
                <g transform="translate(401.000000, 860.000000)">
                  <path d="M9.827 24c0-1.524.253-2.986.705-4.356L2.623 13.604C1.082 16.734.214 20.26.214 24c0 3.737.868 7.261 2.407 10.389l7.905-6.051C10.077 26.973 9.827 25.517 9.827 24" fill="#FBBC05"></path>
                  <path d="M23.714 10.133c3.311 0 6.302 1.173 8.652 3.093l6.836-6.827c-4.166-3.627-9.507-5.867-15.489-5.867-9.287 0-17.268 5.311-21.09 13.071l7.909 6.04c1.822-5.532 7.017-9.511 13.182-9.511" fill="#EB4335"></path>
                  <path d="M23.714 37.867c-6.165 0-11.36-3.978-13.182-9.51l-7.909 6.038c3.822 7.761 11.804 13.072 21.09 13.072 5.732 0 11.204-2.035 15.311-5.849l-7.507-5.804c-2.118 1.335-4.785 2.053-7.804 2.053" fill="#34A853"></path>
                  <path d="M46.145 24c0-1.387-.214-2.88-.534-4.267H23.714V28.8h12.604c-.63 3.091-2.345 5.468-4.8 7.014l7.507 5.804c4.315-4.004 7.121-9.969 7.121-17.618" fill="#4285F4"></path>
                </g>
              </g>
            </g>
          </svg>
          <span>Continue with Google</span>
        </button>
      </div>
    );
  };
  
  export default GoogleButton;
  