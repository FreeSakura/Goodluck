"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff, Settings, Save } from "lucide-react"
import { toast } from "sonner"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [totalMerit, setTotalMerit] = useState(0)
  const [newMerit, setNewMerit] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<any>(null)

  // 检查本地存储中的认证状态
  useEffect(() => {
    const authStatus = localStorage.getItem("adminAuthenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
      fetchMerit()
      setupWebSocket()
    } else {
      setIsFetching(false)
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  // 设置WebSocket连接
  const setupWebSocket = () => {
    try {
      // 动态导入socket.io-client
      import("socket.io-client").then(({ io }) => {
        socketRef.current = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
          path: '/api/socketio'
        })

        socketRef.current.on('connect', () => {
          console.log('Admin WebSocket connected')
          setIsConnected(true)
        })

        socketRef.current.on('disconnect', () => {
          console.log('Admin WebSocket disconnected')
          setIsConnected(false)
        })

        socketRef.current.on('merit:updated', (data: any) => {
          console.log('Admin: Merit updated:', data)
          setTotalMerit(data.totalMerit)
          setNewMerit(data.totalMerit.toString())
          
          // 显示更新通知
          if (data.action === 'increment') {
            toast.info(`有用户增加了功德，当前总功德: ${data.totalMerit.toLocaleString()}`)
          } else if (data.action === 'update') {
            toast.success(`功德数已更新为: ${data.totalMerit.toLocaleString()}`)
          }
        })

        socketRef.current.on('message', (data: any) => {
          console.log('Admin: Received message:', data)
        })
      })
    } catch (error) {
      console.error('Admin WebSocket setup failed:', error)
    }
  }

  // 获取当前功德数
  const fetchMerit = async () => {
    setIsFetching(true)
    try {
      const response = await fetch("/api/merit")
      if (response.ok) {
        const data = await response.json()
        setTotalMerit(data.totalMerit)
        setNewMerit(data.totalMerit.toString())
      }
    } catch (error) {
      console.error("获取功德数据失败:", error)
      toast.error("获取功德数据失败")
    } finally {
      setIsFetching(false)
    }
  }

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error("请输入密码")
      return
    }

    setIsLoading(true)
    try {
      // 这里我们使用一个简单的验证方式
      // 在实际应用中，应该使用更安全的方式
      const response = await fetch("/api/merit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalMerit: 0, // 临时值，仅用于验证密码
          adminPassword: password,
        }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        localStorage.setItem("adminAuthenticated", "true")
        toast.success("登录成功")
        setupWebSocket()
        await fetchMerit()
      } else {
        const error = await response.json()
        toast.error(error.error || "密码错误")
      }
    } catch (error) {
      console.error("登录失败:", error)
      toast.error("登录失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 处理更新功德数
  const handleUpdateMerit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const meritValue = parseInt(newMerit)
    if (isNaN(meritValue) || meritValue < 0) {
      toast.error("请输入有效的非负整数")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/merit", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalMerit: meritValue,
          adminPassword: password, // 重新使用密码进行验证
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTotalMerit(data.totalMerit)
        toast.success("功德数更新成功")
      } else {
        const error = await response.json()
        toast.error(error.error || "更新失败")
      }
    } catch (error) {
      console.error("更新功德数失败:", error)
      toast.error("更新失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 处理登出
  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adminAuthenticated")
    setPassword("")
    if (socketRef.current) {
      socketRef.current.disconnect()
    }
    toast.success("已退出登录")
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              管理员登录
              <Shield className="h-6 w-6" />
            </CardTitle>
            <CardDescription>
              请输入管理员密码以访问功德箱管理界面
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">管理员密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入管理员密码"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "登录中..." : "登录"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-lg text-muted-foreground">正在加载功德数据...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
            <Settings className="h-6 w-6" />
            功德箱管理
            <Settings className="h-6 w-6" />
          </CardTitle>
          <CardDescription>
            管理赛博功德箱的总功德数
          </CardDescription>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isConnected ? '实时监控' : '连接断开'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">当前总功德</div>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-4">
              {totalMerit.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              最后更新: {new Date().toLocaleString()}
            </div>
          </div>

          <form onSubmit={handleUpdateMerit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newMerit">新的功德数</Label>
              <Input
                id="newMerit"
                type="number"
                value={newMerit}
                onChange={(e) => setNewMerit(e.target.value)}
                placeholder="请输入新的功德数"
                min="0"
                step="1"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isLoading ? "更新中..." : "更新功德数"}
              </div>
            </Button>
          </form>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}