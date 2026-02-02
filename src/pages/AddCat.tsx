import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useCreateCat } from "@shared/hooks/useCats";
import { Link, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { z } from "zod";
import { alert } from "@/lib/alerts";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";

const catSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อสัตว์เลี้ยง").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  age: z.string().min(1, "กรุณากรอกอายุ").max(50, "อายุต้องไม่เกิน 50 ตัวอักษร"),
  gender: z.string().min(1, "กรุณาเลือกเพศ"),
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  district: z.string().trim().max(100, "เขต/อำเภอต้องไม่เกิน 100 ตัวอักษร").optional(),
  story: z.string().max(2000, "เรื่องราวต้องไม่เกิน 2000 ตัวอักษร").optional(),
  healthStatus: z.string().max(500, "สถานะสุขภาพต้องไม่เกิน 500 ตัวอักษร").optional(),
  contactName: z.string().trim().min(1, "กรุณากรอกชื่อผู้ติดต่อ").max(100, "ชื่อต้องไม่เกิน 100 ตัวอักษร"),
  contactPhone: z.string().trim().regex(/^[0-9]{9,10}$/, "กรุณากรอกเบอร์โทรศัพท์ 9-10 หลัก"),
  contactLine: z.string().trim().max(50, "Line ID ต้องไม่เกิน 50 ตัวอักษร").optional(),
});

const AddCat = () => {
  const { user } = useAuth();
  const createCat = useCreateCat();
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"ชาย" | "หญิง" | "ไม่ระบุ">("ไม่ระบุ");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [story, setStory] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [isSterilized, setIsSterilized] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactLine, setContactLine] = useState("");

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4 font-prompt">กรุณาเข้าสู่ระบบ</h2>
          <p className="text-muted-foreground mb-6 font-prompt">คุณต้องเข้าสู่ระบบก่อนเพื่อลงประกาศหาบ้านให้หมา หาบ้านให้แมว หรือสัตว์เลี้ยงอื่นๆ ฟรี!</p>
          <Link to="/login"><Button className="font-prompt">เข้าสู่ระบบ</Button></Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const validatedData = catSchema.parse({
        name,
        age,
        gender,
        province,
        district,
        story,
        healthStatus,
        contactName,
        contactPhone,
        contactLine,
      });

      await createCat.mutateAsync({
        name: validatedData.name,
        age: validatedData.age,
        gender: validatedData.gender as "ชาย" | "หญิง" | "ไม่ระบุ",
        province: validatedData.province,
        district: validatedData.district || undefined,
        image_url: imageUrls.length > 0 ? imageUrls : undefined,
        story: validatedData.story || undefined,
        health_status: validatedData.healthStatus || undefined,
        is_sterilized: isSterilized,
        is_adopted: false,
        is_urgent: isUrgent,
        contact_name: validatedData.contactName,
        contact_phone: validatedData.contactPhone,
        contact_line: validatedData.contactLine || undefined,
        user_id: user.id,
      });

      navigate("/adopt");
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          alert.error(err.message);
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 font-prompt">ลงประกาศหาบ้านให้สัตว์เลี้ยง 🏠</h1>
          <p className="text-muted-foreground font-prompt">ช่วยน้องแมวและสุนัขหาบ้านที่อบอุ่น</p>
        </div>

        <Card className="p-6 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="font-prompt">ชื่อสัตว์เลี้ยง *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="font-prompt" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age" className="font-prompt">อายุ *</Label>
                <Input value={age} onChange={(e) => setAge(e.target.value)} placeholder="เช่น 3 เดือน, 1 ปี" required className="font-prompt" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="gender" className="font-prompt">เพศ *</Label>
                <Select value={gender} onValueChange={(value: any) => setGender(value)} required>
                  <SelectTrigger className="font-prompt"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ชาย" className="font-prompt">ชาย</SelectItem>
                    <SelectItem value="หญิง" className="font-prompt">หญิง</SelectItem>
                    <SelectItem value="ไม่ระบุ" className="font-prompt">ไม่ระบุ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="font-prompt">จังหวัด *</Label>
                <Select value={province} onValueChange={setProvince} required>
                  <SelectTrigger className="font-prompt"><SelectValue placeholder="เลือกจังหวัด" /></SelectTrigger>
                  <SelectContent className="max-h-64 overflow-y-auto">
                    {THAI_PROVINCES.map((provinceName) => (
                      <SelectItem key={provinceName} value={provinceName} className="font-prompt">
                        {provinceName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="font-prompt">เขต/อำเภอ</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} className="font-prompt" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="images" className="font-prompt">รูปภาพ (สูงสุด 3 รูป)</Label>
              <MultiImageUpload
                maxImages={3}
                imageUrls={imageUrls}
                onImagesChange={setImageUrls}
                userId={user.id}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="story" className="font-prompt">เรื่องราวของน้อง ๆ</Label>
              <Textarea value={story} onChange={(e) => setStory(e.target.value)} rows={4} className="font-prompt" placeholder="บอกเล่าเรื่องราวของน้องแมวหรือสุนัข..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="healthStatus" className="font-prompt">สภาพสุขภาพ</Label>
              <Textarea value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} rows={3} className="font-prompt" placeholder="สุขภาพดี, มีโรคประจำตัว, ฯลฯ" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox id="sterilized" checked={isSterilized} onCheckedChange={(checked) => setIsSterilized(checked as boolean)} />
                <Label htmlFor="sterilized" className="font-prompt cursor-pointer">ทำหมันแล้ว</Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="urgent" checked={isUrgent} onCheckedChange={(checked) => setIsUrgent(checked as boolean)} />
                <Label htmlFor="urgent" className="font-prompt cursor-pointer">กรณีด่วน (ต้องการบ้านเร่งด่วน)</Label>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 font-prompt">ข้อมูลติดต่อ</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName" className="font-prompt">ชื่อผู้ติดต่อ *</Label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required className="font-prompt" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="font-prompt">เบอร์โทรศัพท์ *</Label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required className="font-prompt" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactLine" className="font-prompt">LINE ID</Label>
                  <Input value={contactLine} onChange={(e) => setContactLine(e.target.value)} className="font-prompt" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full font-prompt gap-2" size="lg" disabled={createCat.isPending}>
              <Heart className="w-5 h-5" />
              {createCat.isPending ? "กำลังลงประกาศ..." : "ลงประกาศหาบ้านให้สัตว์เลี้ยง"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddCat;
