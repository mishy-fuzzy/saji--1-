"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ImageIcon,
  Video,
  Users,
  TrendingUp,
  X,
  Send,
  MapPin,
  CheckCircle,
  Play,
  Plus,
  Camera,
  Smile,
  Hash,
  UserPlus,
  Bell,
  Settings,
} from "lucide-react";
import Image from "next/image";

export default function CommunityPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuthContext();
  const [activeTab, setActiveTab] = useState<
    "feed" | "trending" | "following" | "groups"
  >("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showComments, setShowComments] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [newPostText, setNewPostText] = useState("");
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  const [savedPosts, setSavedPosts] = useState<number[]>([]);
  const [followingUsers, setFollowingUsers] = useState<number[]>([1, 4]);
  const [joinedGroups, setJoinedGroups] = useState<number[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<any[]>([]);
  const [suggestedGroups, setSuggestedGroups] = useState<any[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);

  const handleUnauthorized = useCallback(async () => {
    await logout();
  }, [logout]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.id) {
      setPosts([]);
      setTrendingTopics([]);
      setSuggestedGroups([]);
      setSuggestedUsers([]);
      return;
    }

    const loadCommunity = async () => {
      try {
        const response = await fetch("/api/community/posts", {
          cache: "no-store",
        });

        if (response.status === 401) {
          await handleUnauthorized();
          return;
        }

        const payload = await response.json();
        const data = payload?.data || {};
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        setTrendingTopics(
          Array.isArray(data.trendingTopics) ? data.trendingTopics : [],
        );
        setSuggestedGroups(
          Array.isArray(data.suggestedGroups) ? data.suggestedGroups : [],
        );
        setSuggestedUsers(
          Array.isArray(data.suggestedUsers) ? data.suggestedUsers : [],
        );
      } catch {
        setPosts([]);
        setTrendingTopics([]);
        setSuggestedGroups([]);
        setSuggestedUsers([]);
      }
    };

    loadCommunity();
    const intervalId = window.setInterval(loadCommunity, 25000);
    return () => window.clearInterval(intervalId);
  }, [handleUnauthorized, isAuthenticated, isLoading, user?.id]);

  const trendingPosts = posts.filter((p) => p.likes > 200);

  const followingPosts = posts.filter((p) =>
    followingUsers.includes(p.author.id),
  );

  const toggleLike = (postId: number) => {
    setLikedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  const toggleSave = (postId: number) => {
    setSavedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId],
    );
  };

  const toggleFollow = (userId: number) => {
    setFollowingUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const toggleJoinGroup = (groupId: number) => {
    setJoinedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getDisplayPosts = () => {
    switch (activeTab) {
      case "trending":
        return trendingPosts;
      case "following":
        return followingPosts;
      default:
        return filteredPosts;
    }
  };

  const PostCard = ({ post }: { post: any }) => (
    <Card className="overflow-hidden">
      {/* Post Header */}
      <div className="p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden">
            <Image
              src={post.author.avatar || "/placeholder.svg"}
              alt={post.author.name}
              width={48}
              height={48}
              className="object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {post.author.name}
              </span>
              {post.author.verified && (
                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{post.author.role}</span>
              <span>-</span>
              <span>{post.timestamp}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!followingUsers.includes(post.author.id) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => toggleFollow(post.author.id)}
              className="text-xs bg-transparent"
            >
              Follow
            </Button>
          )}
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-foreground whitespace-pre-line">{post.content}</p>
        {post.location && (
          <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{post.location}</span>
          </div>
        )}
      </div>

      {/* Post Media */}
      {post.images && (
        <div
          className={`grid gap-1 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {post.images.slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPost({ ...post, selectedImage: img })}
              className={`relative overflow-hidden group ${post.images && post.images.length === 1 ? "aspect-video" : "aspect-square"}`}
            >
              <Image
                src={img || "/placeholder.svg"}
                alt=""
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
              {post.images && post.images.length > 4 && idx === 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">
                    +{post.images.length - 4}
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {post.video && (
        <button
          onClick={() => setSelectedPost({ ...post, isVideo: true })}
          className="relative w-full aspect-video overflow-hidden group"
        >
          <Image
            src={post.video || "/placeholder.svg"}
            alt=""
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="w-8 h-8 text-foreground fill-foreground ml-1" />
            </div>
          </div>
        </button>
      )}

      {/* Post Actions */}
      <div className="p-4 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-6">
          <button
            onClick={() => toggleLike(post.id)}
            className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Heart
              className={`w-5 h-5 ${likedPosts.includes(post.id) ? "fill-red-500 text-red-500" : ""}`}
            />
            <span className="text-sm">
              {likedPosts.includes(post.id) ? post.likes + 1 : post.likes}
            </span>
          </button>
          <button
            onClick={() => {
              setSelectedPost(post);
              setShowComments(true);
            }}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-sm">{post.shares}</span>
          </button>
        </div>
        <button
          onClick={() => toggleSave(post.id)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Bookmark
            className={`w-5 h-5 ${savedPosts.includes(post.id) ? "fill-primary text-primary" : ""}`}
          />
        </button>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Community
          </h1>
          <p className="text-muted-foreground">
            Connect with service providers and homeowners
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "feed", label: "Feed", icon: Hash },
            { id: "trending", label: "Trending", icon: TrendingUp },
            { id: "following", label: "Following", icon: Users },
            { id: "groups", label: "Groups", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 max-w-2xl">
            {/* Create Post Card */}
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-semibold">Y</span>
                </div>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="flex-1 text-left px-4 py-2.5 bg-muted rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  What's on your mind?
                </button>
              </div>
              <div className="flex items-center justify-around mt-4 pt-4 border-t border-border">
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ImageIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Photo</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Video className="w-5 h-5 text-red-500" />
                  <span className="text-sm">Video</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Camera className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Live</span>
                </button>
              </div>
            </Card>

            {/* Search */}
            {activeTab === "feed" && (
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search posts, people, topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            {/* Groups Tab */}
            {activeTab === "groups" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Suggested Groups
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 bg-transparent"
                  >
                    <Plus className="w-4 h-4" />
                    Create Group
                  </Button>
                </div>
                {suggestedGroups.map((group) => (
                  <Card key={group.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden">
                        <Image
                          src={group.image || "/placeholder.svg"}
                          alt={group.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {group.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {group.members.toLocaleString()} members
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      </div>
                      <Button onClick={() => toggleJoinGroup(group.id)}>
                        {joinedGroups.includes(group.id) ? "Joined" : "Join"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* Posts Feed */
              <div className="space-y-4">
                {getDisplayPosts().length > 0 ? (
                  getDisplayPosts().map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">
                      {activeTab === "following"
                        ? "No posts from people you follow"
                        : "No posts found"}
                    </p>
                    <p className="text-muted-foreground">
                      {activeTab === "following"
                        ? "Follow more people to see their posts here"
                        : "Try a different search term"}
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Desktop Only */}
          <aside className="hidden lg:block w-80 space-y-6">
            {/* Trending Topics */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trending Topics
              </h3>
              <div className="space-y-3">
                {trendingTopics.map((topic, idx) => (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between hover:bg-muted p-2 rounded-lg transition-colors"
                  >
                    <div>
                      <span className="text-primary font-medium">
                        {topic.tag}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {topic.posts} posts
                      </p>
                    </div>
                    <span className="text-xs text-green-500 font-medium">
                      {topic.growth}
                    </span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Suggested Users */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Who to Follow
              </h3>
              <div className="space-y-3">
                {suggestedUsers.map((user) => (
                  <div key={user.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.role}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-transparent"
                      onClick={() => toggleFollow(user.id)}
                    >
                      {followingUsers.includes(user.id)
                        ? "Following"
                        : "Follow"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Popular Groups */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Popular Groups
              </h3>
              <div className="space-y-3">
                {suggestedGroups.slice(0, 3).map((group) => (
                  <div key={group.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden">
                      <Image
                        src={group.image || "/placeholder.svg"}
                        alt={group.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.members.toLocaleString()} members
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs bg-transparent"
                      onClick={() => toggleJoinGroup(group.id)}
                    >
                      {joinedGroups.includes(group.id) ? "Joined" : "Join"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </div>

      {/* Create Post Modal */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-lg">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Create Post
            </h3>
            <button onClick={() => setShowCreatePost(false)}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="py-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-semibold">Y</span>
              </div>
              <div>
                <p className="font-semibold text-foreground">You</p>
                <p className="text-xs text-muted-foreground">Public post</p>
              </div>
            </div>
            <Textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's on your mind?"
              className="min-h-[150px] border-0 resize-none focus-visible:ring-0 text-lg"
            />
            <div className="flex items-center gap-4 py-4 border-t border-border">
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <ImageIcon className="w-6 h-6 text-green-500" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Video className="w-6 h-6 text-red-500" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <MapPin className="w-6 h-6 text-blue-500" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <Smile className="w-6 h-6 text-yellow-500" />
              </button>
            </div>
          </div>
          <Button className="w-full" disabled={!newPostText.trim()}>
            Post
          </Button>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog
        open={!!selectedPost && !showComments}
        onOpenChange={() => setSelectedPost(null)}
      >
        <DialogContent className="max-w-4xl p-0 bg-black overflow-hidden">
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {selectedPost?.isVideo ? (
            <div className="aspect-video bg-black flex items-center justify-center relative">
              <Image
                src={selectedPost.video || "/placeholder.svg"}
                alt=""
                fill
                className="object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-10 h-10 text-white fill-white ml-1" />
                </div>
              </div>
            </div>
          ) : (
            selectedPost?.selectedImage && (
              <div className="aspect-video relative">
                <Image
                  src={selectedPost.selectedImage || "/placeholder.svg"}
                  alt=""
                  fill
                  className="object-contain"
                />
              </div>
            )
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[80vh]">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Comments ({selectedPost?.comments})
            </h3>
            <button onClick={() => setShowComments(false)}>
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 overflow-hidden">
                  <Image
                    src={`https://images.unsplash.com/photo-150${i}003211169-0a1dd7228f2d?w=40&h=40&fit=crop`}
                    alt=""
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="bg-muted rounded-xl p-3">
                    <p className="font-medium text-sm text-foreground">
                      User {i}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Great work! Love the attention to detail.
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 px-2">
                    <button className="text-xs text-muted-foreground hover:text-foreground">
                      Like
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-foreground">
                      Reply
                    </button>
                    <span className="text-xs text-muted-foreground">
                      2h ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">Y</span>
              </div>
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1"
                />
                <Button size="icon" disabled={!commentText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
