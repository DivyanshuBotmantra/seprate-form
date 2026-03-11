// import logo from "@/../public/logo_white.png";
import logo from "@/../public/logo_white.png";
import loginImage from "@/../public/compressedHeroImg.jpg";
import ForgotPassword from '../components/common/forgot-password';

const ForgotPasswordpage = () => {
    return (
        <div className="bg-sidebar grid min-h-svh lg:grid-cols-[60%_40%]">
            <div className="relative hidden lg:flex lg:flex-col ">
                <div className="bg-[#010101] h-full w-full  overflow-hidden relative flex flex-col justify-center ">
                    <div className="absolute top-5 left-6">
                        <a href="#" className="flex items-center gap-2 font-medium">
                            <img src={logo} alt="logo" className="w-18 lg:w-24" />
                        </a>
                    </div>
                    <div className="flex justify-center">
                        <img
                            src={loginImage}
                            alt="hero-img"
                            fetchPriority="high"
                            loading="eager"
                            style={{
                                width: "90%",
                                objectFit: "contain",
                            }}
                        />
                    </div>
                    <div className="flex justify-center">
                        <span className="text-white text-3xl font-bold mt-0">
                            <span className="text-[#f79524] pr-2">
                                bot-IQ <span className="text-white">Admin Console</span>
                            </span>
                        </span>
                    </div>
                    <div className="flex justify-center translate-y-3">
                        <p className="text-white text-sm text-center w-full opacity-75">
                            Copyright © 2025 Botmantra. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Footer */}
            </div>

            <div className="flex flex-col gap-4 p-6 md:p-4 justify-center items-center">
                <ForgotPassword />
            </div>
        </div>
    );
};

export default ForgotPasswordpage;
