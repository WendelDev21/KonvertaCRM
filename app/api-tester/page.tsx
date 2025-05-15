import { ApiTester } from "@/components/integrations/api-tester"

export default function ApiTesterPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">API Tester</h1>
      <ApiTester />
    </div>
  )
}
