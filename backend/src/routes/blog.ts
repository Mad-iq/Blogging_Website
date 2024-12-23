import { createBlogInput,updateBlogInput } from "@mad_iqs/blogging-web";
import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from 'hono/jwt'


export const blogRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
      JWT_SECRET: string
    },
    Variables: {
        userId: string;
    }
  }>();

blogRouter.use('/*', async (c, next) => {  //this middleware will extract the authorid and pass it to the routehandler
    const authHeader= c.req.header("authorization") || "";  //authHeader is of string type but we might also get an undefined response hence add the empty strings
    try {
        const user= await verify(authHeader, c.env.JWT_SECRET);
        if(user){
            c.set("userId", user.id as string);
             await next();
        } else{
          c.status(403);
          return c.json({
            error: "unauthorized"
          });
        }
    } catch (e) {
        c.status(403);
        return c.json({
            msg: "You are not logged in"
        });
    }
    
  });


blogRouter.post('/', async (c) => {
  const body= await c.req.json();
  const { success }= createBlogInput.safeParse(body);
  if(!success){
      c.status(411);
      return c.json({
          msg: "Wrong inputs :("
      })
  }
    const authorId= c.get("userId");
    // if (!authorId) {
    //     c.status(401); // Unauthorized if no authorId is found
    //     return c.json({ error: "No authorId found" });
    //   }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

 const blog= await prisma.post.create({
    data:{
        title: body.title,
        content: body.content,
        authorId: Number(authorId)
    }
  })

  return c.json({
    id: blog.id    //After creating a new resource (e.g., a blog post), it's common practice to return the unique identifier (id) of that resource. This allows the client to know the id of the newly created post and potentially use it in subsequent operations like viewing or updating the post.
  })
  
})



blogRouter.put('/', async (c) => {
  const body= await c.req.json();
  const { success }= updateBlogInput.safeParse(body);
  if(!success){
      c.status(411);
      return c.json({
          msg: "Wrong inputs :("
      })
  }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

 const blog= await prisma.post.update({
    where:{
        id: body.id
    },
    data:{
        title: body.title,
        content: body.content,
    }
  })

  return c.json({
    id: blog.id   //After updating a resource, returning the id confirms which resource was updated. This can be useful for the client to ensure that the correct post was modified, especially when working with dynamic content or multiple posts.
  })
})

//ideally there should be pagination here. send like 10 blogs and then ask user if you want to see more
blogRouter.get('/bulk', async (c) => {
    //we dont need the body here
      const prisma = new PrismaClient({
          datasourceUrl: c.env.DATABASE_URL,
      }).$extends(withAccelerate())
  
      const blogs= await prisma.post.findMany({
        select: {
          content: true,
          title: true,
          id: true,
          author: {
            select: {
              name: true
            }
          }
        }
      });  //findMany has no parameters here hence it will return everything
      
      return c.json({
          blogs
      })
  })



blogRouter.get('/:id',async (c) => {
    const id= c.req.param("id");
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())

  // wrap it in a try catch block because the blog with this id might not exist
  try {
    const blog= await prisma.post.findFirst({
        where: {
            id: Number(id)
        },
        select: {
          id: true,
          title: true,
          content: true,
          author: {
              select: { 
                name: true
              }
          }
        }
      })

      if (!blog) {
        c.status(404);
        return c.json({ msg: "Blog not found" });
      }
      return c.json({
        blog    
      });
  } catch(e) {
      c.status(411);
      return c.json({
        msg: "Error while fetching data"
      });
  }
})



