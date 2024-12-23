import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signupInput,signinInput } from "@mad_iqs/blogging-web";

export const userRouter = new Hono<{
    Bindings: {
      DATABASE_URL: string
      JWT_SECRET: string
    }
  }>();


userRouter.post('/signup', async (c) => {
    const body= await c.req.json();
    const { success }= signupInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({
            msg: "Wrong inputs :("
        })
    }
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate())
  
  try{
    const user= await prisma.user.create({
      data:{
        name: body.name,
        email: body.email,       //email should be unique as mentioned in database schema hence check at db level
        password: body.password, 
      }
    })
    
    const jwt=  await sign({id: user.id}, c.env.JWT_SECRET) ; //"secret" should be another env variable in toml file
    return c.text(jwt)
} catch(e){
    console.log(e);
      c.status(411);
      return c.text("Invalid");
    }
  })
  
  
  userRouter.post('/signin', async (c) => {
      const body = await c.req.json();
      const { success }= signinInput.safeParse(body);
      if(!success){
        c.status(411);
        return c.json({
            msg: "Wrong inputs :("
        })
    }

      const prisma = new PrismaClient({
          datasourceUrl: c.env?.DATABASE_URL	, //the ? denotes optional chaining. the optional chaining operator (?.) is used to access the DATABASE_URL property of c.env only if c.env is not null or undefined. If c.env is null or undefined, it short-circuits and returns undefined instead of throwing an error.
      }).$extends(withAccelerate());
  
      try{
        const user = await prisma.user.findUnique({
            where: {
                email: body.email,
                password: body.password,
            },
        });
    
        if (!user) {
            c.status(403);
            return c.json({ error: "user not found" });
        }
    
        const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.text(jwt);
      } catch (e){
        console.log(e);
        c.status(411);
        return c.text("Invalid");
      }
      
  })
  