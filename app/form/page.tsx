"use client";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import axios from "axios";

function page() {
  const [code, setCode] = useState("");
  const router = useRouter();
  const fid = useSearchParams().get("f");
  if (fid === null) return;

  const handleClick = async () => {
    try {
      const res = await axios.post(`/api/auth?f=${fid}`, { code });
      console.log("resed", res);
      if(res.status === 200) 
        router.push(`/form/${fid}`);
    } catch (error) {}
  };

  return (
    <div className="h-[100vh] flex justify-center items-center bg-gray-200">
      <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-y-6">
        <h1 className="text-5xl">Company Name</h1>
        <p className="text-xl ">Enter E-Mail Code</p>
        <InputOTP maxLength={6} value={code} onChange={(value) => setCode(value)}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
          </InputOTPGroup>
          <InputOTPGroup>
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPGroup>
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPGroup>
            <InputOTPSlot index={3} />
          </InputOTPGroup>
          <InputOTPGroup>
            <InputOTPSlot index={4} />
          </InputOTPGroup>
          <InputOTPGroup>
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        {/* <Button className="w-full" onClick={handleVerify}> */}
        {/* <Button className="w-full" onClick={sendEmail}> */}
        <Button className="w-full" onClick={handleClick}>
          Verify
        </Button>
      </div>
    </div>
  );
}
export default page;
