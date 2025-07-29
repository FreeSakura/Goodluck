"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, Zap } from "lucide-react"

export default function Home() {
  const [totalMerit, setTotalMerit] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<any>(null)

  // 初始化加载功德数据
  useEffect(() => {
    fetchMerit()
    setupWebSocket()
    
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
          console.log('WebSocket connected')
          setIsConnected(true)
        })

        socketRef.current.on('disconnect', () => {
          console.log('WebSocket disconnected')
          setIsConnected(false)
        })

        socketRef.current.on('merit:updated', (data: any) => {
          console.log('Merit updated:', data)
          setTotalMerit(data.totalMerit)
          
          // 如果是其他用户触发的更新，显示动画效果
          if (data.action === 'increment') {
            setIsAnimating(true)
            setTimeout(() => setIsAnimating(false), 300)
          }
        })

        socketRef.current.on('message', (data: any) => {
          console.log('Received message:', data)
        })
      })
    } catch (error) {
      console.error('WebSocket setup failed:', error)
    }
  }

  // 获取当前功德数
  const fetchMerit = async () => {
    try {
      const response = await fetch("/api/merit")
      if (response.ok) {
        const data = await response.json()
        setTotalMerit(data.totalMerit)
      }
    } catch (error) {
      console.error("获取功德数据失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 增加功德
  const addMerit = async () => {
    if (isAnimating) return
    
    setIsAnimating(true)
    try {
      const response = await fetch("/api/merit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setTotalMerit(data.totalMerit)
      }
    } catch (error) {
      console.error("增加功德失败:", error)
    } finally {
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-lg text-muted-foreground">正在加载功德数据...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-4 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-950 dark:to-pink-950">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2">
            <Heart className="h-8 w-8" />
            赛博功德箱
            <Heart className="h-8 w-8" />
          </CardTitle>
          <CardDescription className="text-lg">
            积累功德，福报自来
          </CardDescription>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isConnected ? '实时同步' : '连接断开'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-sm text-muted-foreground mb-2">当前总功德</div>
            <div className={`text-6xl font-bold text-orange-600 dark:text-orange-400 mb-4 transition-all duration-300 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
              {totalMerit.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              功德无量，福报绵长
            </div>
          </div>
          
          <Button
            onClick={addMerit}
            disabled={isAnimating}
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 transform transition-all duration-200 hover:scale-105 active:scale-95"
            size="lg"
          >
            <div className="flex items-center gap-2">
              <Zap className={`h-6 w-6 ${isAnimating ? "animate-pulse" : ""}`} />
              功德+1
              <Zap className={`h-6 w-6 ${isAnimating ? "animate-pulse" : ""}`} />
            </div>
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            点击按钮，积累功德，每一次善举都值得记录
          </div>
        </CardContent>
      </Card>
    </div>
  )
}